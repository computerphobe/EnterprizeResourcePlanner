const mongoose = require("mongoose");
const Invoice = mongoose.model("Invoice");
const Client = mongoose.model("Client");

/**
 * Email-based client invoice fetching for hospital and doctor roles
 * Uses email as the reliable link between user accounts and client records
 * Includes backward compatibility for existing clients
 */
const getClientInvoices = async (req, res) => {
  try {
    // Get user info from the logged-in user
    const userEmail = req.user.email;
    const userRole = req.user.role;
    const userId = req.user.id;
    const userName = req.user.name;
    const organizationId = req.user.organizationId;
    
    console.log(`🔍 Fetching invoices for ${userRole} user: ${userEmail} (ID: ${userId})`);
    
    // Build search criteria with multiple fallback options
    const searchCriteria = [
      // Primary: Find by email and role match
      {
        email: userEmail,
        userRole: userRole,
        removed: false
      },
      // Secondary: Find by linkedUserId (direct link to user account)
      {
        linkedUserId: userId,
        removed: false
      },
      // Tertiary: Find by email only (backward compatibility)
      {
        email: userEmail,
        removed: false
      }
    ];
    
    // Add organization filter if available
    if (organizationId) {
      searchCriteria.forEach(criteria => {
        criteria.organizationId = organizationId;
      });
    }
    
    let client = null;
    let searchMethod = '';
    
    // Try each search method in order of preference
    for (let i = 0; i < searchCriteria.length; i++) {
      client = await Client.findOne(searchCriteria[i]);
      if (client) {
        searchMethod = i === 0 ? 'email+role match' : 
                     i === 1 ? 'linkedUserId match' : 
                     'email fallback';
        console.log(`✅ Found client via ${searchMethod}: ${client.name} (ID: ${client._id})`);
        break;
      }
    }
    
    // Final fallback: Try name-based search (least reliable)
    if (!client && userName) {
      const namePattern = userName.split(' ').filter(n => n.length > 2).join('|');
      if (namePattern) {
        client = await Client.findOne({
          name: { $regex: new RegExp(namePattern, 'i') },
          removed: false,
          ...(organizationId && { organizationId: organizationId })
        });
        
        if (client) {
          searchMethod = 'name pattern match';
          console.log(`🔄 Found client via name matching: ${client.name}`);
        }
      }
    }

    // If client found but missing modern fields, update them
    if (client) {
      const updateFields = {};
      let needsUpdate = false;
      
      if (!client.email && userEmail) {
        updateFields.email = userEmail;
        needsUpdate = true;
      }
      if (!client.linkedUserId && userId) {
        updateFields.linkedUserId = userId;
        needsUpdate = true;
      }
      if (!client.userRole && userRole) {
        updateFields.userRole = userRole;
        needsUpdate = true;
      }
      if (!client.organizationId && organizationId) {
        updateFields.organizationId = organizationId;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log(`🔧 Updating client record with missing fields:`, updateFields);
        await Client.findByIdAndUpdate(client._id, updateFields);
        client = await Client.findById(client._id); // Reload updated client
      }
    }

    // If no client found, return empty result with helpful message
    if (!client) {
      console.log(`❌ No client record found for ${userRole} user: ${userEmail}`);
      return res.status(200).json({
        success: true,
        result: [],
        message: `No client record found for ${userRole}. Please contact your administrator to set up billing.`,
        clientInfo: null,
        searchAttempts: {
          email: userEmail,
          role: userRole,
          userId: userId,
          organizationId: organizationId
        }
      });
    }

    console.log(`✅ Found client record: ${client.name} (ID: ${client._id}, Role: ${client.userRole})`);
    
    // Primary approach: Fetch invoices for this specific client
    const invoiceQuery = {
      client: client._id,
      removed: false
    };
    
    // Add organization filter for better security
    if (client.organizationId || organizationId) {
      invoiceQuery.organizationId = client.organizationId || organizationId;
    }
    
    console.log(`🔍 Primary search - invoices for client: ${client.name} (Role: ${client.userRole}, UserID: ${userId})`);
    
    const clientInvoices = await Invoice.find(invoiceQuery)
      .populate("client", "name email userRole hospitalName linkedUserId")
      .populate("payment")
      .populate("createdBy", "name email role")
      .sort({ date: -1 });
    
    console.log(`📊 Found ${clientInvoices.length} invoices via client lookup`);
    
    // Secondary approach: Find all invoices where the client's linkedUserId matches current user
    console.log(`🔍 Secondary search - invoices by linkedUserId: ${userId}`);
    
    const allClientsForUser = await Client.find({
      linkedUserId: userId,
      removed: false,
      ...(organizationId && { organizationId: organizationId })
    });
    
    console.log(`👥 Found ${allClientsForUser.length} client records linked to user: ${userId}`);
    
    let userInvoices = [];
    if (allClientsForUser.length > 0) {
      const clientIds = allClientsForUser.map(c => c._id);
      const userInvoiceQuery = {
        client: { $in: clientIds },
        removed: false,
        ...(organizationId && { organizationId: organizationId })
      };
      
      userInvoices = await Invoice.find(userInvoiceQuery)
        .populate("client", "name email userRole hospitalName linkedUserId")
        .populate("payment")
        .populate("createdBy", "name email role")
        .sort({ date: -1 });
        
      console.log(`📊 Found ${userInvoices.length} invoices via linkedUserId lookup`);
    }
    
    // Combine and deduplicate invoices
    const allInvoices = [...clientInvoices];
    userInvoices.forEach(invoice => {
      if (!allInvoices.find(existing => existing._id.toString() === invoice._id.toString())) {
        allInvoices.push(invoice);
      }
    });
    
    console.log(`📊 Combined total: ${allInvoices.length} unique invoices`);
    
    // Enhanced filtering based on user ID and role
    const userFilteredInvoices = allInvoices.filter(invoice => {
      if (!invoice.client) return false;
      
      // Ensure the invoice belongs to the correct user
      const userIdMatches = !invoice.client.linkedUserId || 
                           invoice.client.linkedUserId.toString() === userId;
      const roleMatches = invoice.client.userRole === userRole;
      
      // For additional security, check if email matches (if available)
      const emailMatches = !invoice.client.email || 
                          !userEmail || 
                          invoice.client.email.toLowerCase() === userEmail.toLowerCase();
      
      return userIdMatches && roleMatches && emailMatches;
    });
    
    console.log(`🔒 Final filtering: ${allInvoices.length} -> ${userFilteredInvoices.length} invoices (UserID: ${userId}, Role: ${userRole})`);
    
    // Additional security: ensure client's linkedUserId matches the current user
    if (client.linkedUserId && client.linkedUserId.toString() !== userId) {
      console.log(`⚠️ Security warning: Client linkedUserId (${client.linkedUserId}) doesn't match current user (${userId})`);
      // Still allow if this is a legacy client, but log the mismatch
    }
      // Transform data for frontend display
    const formattedInvoices = userFilteredInvoices.map(invoice => ({
      _id: invoice._id,
      billNumber: `INV-${invoice.number}/${invoice.year}`,
      number: invoice.number,
      year: invoice.year,
      createdAt: invoice.date,
      dueDate: invoice.expiredDate,
      totalAmount: invoice.total || 0,
      status: invoice.paymentStatus || "unknown",
      paymentStatus: invoice.paymentStatus || "unknown",
      invoiceStatus: invoice.status || "unknown",
      credit: invoice.credit || 0,
      currency: invoice.currency || "INR",
      pdf: invoice.pdf || null,
      items: invoice.items || [],
      client: invoice.client || {},
      patientName: invoice.patientName || null, // Include patient name
      taxRate: invoice.taxRate || 0,
      subTotal: invoice.subTotal || 0,
      taxTotal: invoice.taxTotal || 0,
      discount: invoice.discount || 0,
      notes: invoice.notes || "",
      createdBy: invoice.createdBy ? {
        name: invoice.createdBy.name,
        email: invoice.createdBy.email,
        role: invoice.createdBy.role
      } : null
    }));

    return res.status(200).json({
      success: true,
      result: formattedInvoices,
      message: formattedInvoices.length > 0 
        ? `Found ${formattedInvoices.length} invoices for ${client.userRole}` 
        : `No invoices found for ${client.userRole}`,
      clientInfo: {
        id: client._id,
        name: client.name,
        email: client.email,
        role: client.userRole,
        hospitalName: client.hospitalName, // Include hospital name
        linkedUserId: client.linkedUserId,
        isLegacyClient: !client.email || !client.organizationId, // Flag for legacy clients
        searchMethod: searchMethod // How the client was found
      },
      summary: {
        totalInvoices: formattedInvoices.length,
        totalAmount: formattedInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
        paidInvoices: formattedInvoices.filter(inv => inv.paymentStatus === 'paid').length,
        unpaidInvoices: formattedInvoices.filter(inv => inv.paymentStatus === 'unpaid').length,
        overdueInvoices: formattedInvoices.filter(inv => inv.isOverdue).length,
        partiallyPaidInvoices: formattedInvoices.filter(inv => inv.paymentStatus === 'partially').length,
        filteringInfo: {
          rawInvoicesFound: allInvoices.length,
          finalFilteredInvoices: userFilteredInvoices.length,
          userIdFilter: userId,
          roleFilter: userRole
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching invoices:", error);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Error fetching invoices",
      error: error.message
    });
  }
};

module.exports = getClientInvoices;

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
    const organizationId = req.user.organizationId;
    
    console.log(`🔍 Fetching invoices for ${userRole} user: ${userEmail}`);
    
    // Try to find client record by email first (new approach)
    let client = await Client.findOne({
      email: userEmail,
      removed: false,
      // Make organizationId and userRole optional for backward compatibility
      ...(organizationId && { organizationId: organizationId }),
      ...(userRole && { userRole: userRole })
    });

    // Backward compatibility: If no client found by email, try other methods
    if (!client) {
      console.log(`📋 No client found by email, trying backward compatibility methods...`);
      
      // Try to find by linkedUserId
      client = await Client.findOne({
        linkedUserId: req.user.id,
        removed: false
      });
      
      // If still no client, try to find by name matching (less reliable but backward compatible)
      if (!client) {
        const userName = `${req.user.name} ${req.user.surname || ''}`.trim();
        client = await Client.findOne({
          name: { $regex: new RegExp(userName, 'i') },
          removed: false
        });
        
        if (client) {
          console.log(`🔄 Found client by name matching: ${client.name}`);
        }
      }
      
      if (client) {
        console.log(`🔄 Found client via backward compatibility: ${client.name}`);
        
        // Update the client record with missing fields for future use
        const updateFields = {};
        if (!client.email && userEmail) updateFields.email = userEmail;
        if (!client.organizationId && organizationId) updateFields.organizationId = organizationId;
        if (!client.userRole && userRole) updateFields.userRole = userRole;
        if (!client.linkedUserId) updateFields.linkedUserId = req.user.id;
        
        if (Object.keys(updateFields).length > 0) {
          console.log(`🔧 Updating client record with missing fields:`, updateFields);
          await Client.findByIdAndUpdate(client._id, updateFields);
          // Reload the client with updated fields
          client = await Client.findById(client._id);
        }
      }
    }

    if (!client) {
      console.log(`❌ No client record found for email: ${userEmail}`);
      return res.status(200).json({
        success: true,
        result: [],
        message: "No client record found. Please contact your administrator.",
        clientInfo: null
      });
    }

    console.log(`✅ Found client record: ${client.name} (ID: ${client._id})`);
    
    // Fetch invoices for this client
    const invoiceQuery = {
      client: client._id,
      removed: false
    };
    
    // Add organization filter only if both client and user have organizationId
    if (client.organizationId && organizationId) {
      invoiceQuery.organizationId = organizationId;
    }
      const invoices = await Invoice.find(invoiceQuery)
      .populate("client", "name email userRole hospitalName")
      .populate("payment")
      .sort({ date: -1 });
    
    console.log(`📊 Found ${invoices.length} invoices for client ${client.name}`);
      // Transform data for frontend display
    const formattedInvoices = invoices.map(invoice => ({
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
      notes: invoice.notes || ""
    }));

    return res.status(200).json({
      success: true,
      result: formattedInvoices,
      message: formattedInvoices.length > 0 
        ? `Found ${formattedInvoices.length} invoices` 
        : "No invoices found",      clientInfo: {
        id: client._id,
        name: client.name,
        email: client.email,
        role: client.userRole,
        hospitalName: client.hospitalName, // Include hospital name
        linkedUserId: client.linkedUserId,
        isLegacyClient: !client.email || !client.organizationId // Flag for legacy clients
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

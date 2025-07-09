const mongoose = require("mongoose");
const Invoice = mongoose.model("Invoice");
const Client = mongoose.model("Client");
const Order = mongoose.model("Order");

/**
 * Simplified user-specific invoice fetching for hospital and doctor roles
 * Fetches invoices based on user's orders and direct user matching
 */
const getUserInvoices = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const userRole = req.user.role;
    const userName = req.user.name;
    const organizationId = req.user.organizationId;
    
    console.log(`🔍 Fetching invoices for ${userRole} user: ${userEmail} (ID: ${userId})`);
    
    // Approach 1: Find invoices through orders
    let orderBasedInvoices = [];
    try {
      // Get all orders for this user
      const userOrders = await Order.find({
        $or: [
          { doctorId: userId },
          { createdBy: userId },
          ...(userRole === 'hospital' ? [{ hospitalId: userId }] : [])
        ],
        isDeleted: false
      }).select('_id orderNumber');
      
      console.log(`📦 Found ${userOrders.length} orders for user ${userId}`);
      
      if (userOrders.length > 0) {
        // For now, we'll use a simple approach - find invoices with matching patient names or user details
        // This is a basic implementation that can be enhanced based on your business logic
        
        const searchTerms = [
          userName,
          userEmail,
          req.user.hospitalName
        ].filter(Boolean);
        
        const searchPattern = searchTerms.join('|');
        
        if (searchPattern) {
          orderBasedInvoices = await Invoice.find({
            $or: [
              { patientName: { $regex: new RegExp(searchPattern, 'i') } },
              { notes: { $regex: new RegExp(searchPattern, 'i') } }
            ],
            removed: false,
            ...(organizationId && { organizationId: organizationId })
          })
          .populate("client", "name email userRole hospitalName linkedUserId")
          .populate("payment")
          .populate("createdBy", "name email role")
          .sort({ date: -1 });
        }
      }
      
      console.log(`📄 Found ${orderBasedInvoices.length} order-based invoices`);
    } catch (error) {
      console.error('Error fetching order-based invoices:', error);
    }
    
    // Approach 2: Find invoices through client matching (existing logic)
    let clientBasedInvoices = [];
    try {
      // Find client records for this user
      const userClients = await Client.find({
        $or: [
          { linkedUserId: userId },
          { email: userEmail },
          ...(userName ? [{ name: { $regex: new RegExp(userName, 'i') } }] : [])
        ],
        removed: false,
        ...(organizationId && { organizationId: organizationId })
      });
      
      console.log(`👥 Found ${userClients.length} client records for user`);
      
      if (userClients.length > 0) {
        const clientIds = userClients.map(c => c._id);
        
        clientBasedInvoices = await Invoice.find({
          client: { $in: clientIds },
          removed: false,
          ...(organizationId && { organizationId: organizationId })
        })
        .populate("client", "name email userRole hospitalName linkedUserId")
        .populate("payment")
        .populate("createdBy", "name email role")
        .sort({ date: -1 });
      }
      
      console.log(`📄 Found ${clientBasedInvoices.length} client-based invoices`);
    } catch (error) {
      console.error('Error fetching client-based invoices:', error);
    }
    
    // Approach 3: Direct invoice search by user details
    let directInvoices = [];
    try {
      const searchTerms = [userName, userEmail].filter(Boolean);
      
      if (searchTerms.length > 0) {
        const searchPattern = searchTerms.map(term => 
          term.split(' ').filter(word => word.length > 2)
        ).flat().join('|');
        
        if (searchPattern) {
          directInvoices = await Invoice.find({
            $or: [
              { patientName: { $regex: new RegExp(searchPattern, 'i') } },
              { notes: { $regex: new RegExp(searchPattern, 'i') } }
            ],
            removed: false,
            ...(organizationId && { organizationId: organizationId })
          })
          .populate("client", "name email userRole hospitalName linkedUserId")
          .populate("payment")
          .populate("createdBy", "name email role")
          .sort({ date: -1 });
        }
      }
      
      console.log(`📄 Found ${directInvoices.length} direct invoices`);
    } catch (error) {
      console.error('Error fetching direct invoices:', error);
    }
    
    // Combine and deduplicate invoices
    const allInvoices = [...orderBasedInvoices, ...clientBasedInvoices, ...directInvoices];
    const uniqueInvoices = allInvoices.filter((invoice, index, self) => 
      index === self.findIndex(inv => inv._id.toString() === invoice._id.toString())
    );
    
    console.log(`📊 Combined: ${allInvoices.length} total, ${uniqueInvoices.length} unique invoices`);
    
    // Filter for role and user matching
    const filteredInvoices = uniqueInvoices.filter(invoice => {
      // Basic role matching
      if (invoice.client && invoice.client.userRole && invoice.client.userRole !== userRole) {
        return false;
      }
      
      // User ID matching (if available)
      if (invoice.client && invoice.client.linkedUserId) {
        return invoice.client.linkedUserId.toString() === userId;
      }
      
      // Email matching (if available)
      if (invoice.client && invoice.client.email && userEmail) {
        return invoice.client.email.toLowerCase() === userEmail.toLowerCase();
      }
      
      // If no specific matching criteria, include it (for backward compatibility)
      return true;
    });
    
    console.log(`🔒 Final filtering: ${uniqueInvoices.length} -> ${filteredInvoices.length} invoices`);
    
    // Transform data for frontend display
    const formattedInvoices = filteredInvoices.map(invoice => ({
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
      patientName: invoice.patientName || null,
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
        ? `Found ${formattedInvoices.length} invoices for ${userRole}` 
        : `No invoices found for ${userRole}`,
      userInfo: {
        id: userId,
        name: userName,
        email: userEmail,
        role: userRole,
        organizationId: organizationId
      },
      summary: {
        totalInvoices: formattedInvoices.length,
        totalAmount: formattedInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
        paidInvoices: formattedInvoices.filter(inv => inv.paymentStatus === 'paid').length,
        unpaidInvoices: formattedInvoices.filter(inv => inv.paymentStatus === 'unpaid').length,
        partiallyPaidInvoices: formattedInvoices.filter(inv => inv.paymentStatus === 'partially').length,
        searchResults: {
          orderBased: orderBasedInvoices.length,
          clientBased: clientBasedInvoices.length,
          direct: directInvoices.length,
          unique: uniqueInvoices.length,
          filtered: filteredInvoices.length
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching user invoices:", error);
    return res.status(500).json({
      success: false,
      result: null,
      message: "Error fetching invoices",
      error: error.message
    });
  }
};

module.exports = getUserInvoices;

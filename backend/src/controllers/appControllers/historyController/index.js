const mongoose = require('mongoose');
const Order = require('@/models/appModels/Order');
const Invoice = require('@/models/appModels/Invoice');
const Returns = require('@/models/appModels/Returns');
const Client = require('@/models/appModels/Client');
const Admin = require('@/models/coreModels/Admin');

const getHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      month,
      year,
      activityType,
      client,
      performedBy,
      status,
      minAmount,
      maxAmount,
      search
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (month && year) {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);
      dateFilter = {
        $gte: startOfMonth,
        $lte: endOfMonth
      };
    } else if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      dateFilter = {
        $gte: startOfYear,
        $lte: endOfYear
      };
    }

    // Aggregation pipeline to combine data from all collections
    const pipeline = [];

    // Orders data
    const ordersPipeline = [
      {
        $match: {
          ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
          ...(client && { 'client': new mongoose.Types.ObjectId(client) }),
          ...(search && {
            $or: [
              { doctorName: { $regex: search, $options: 'i' } },
              { hospitalName: { $regex: search, $options: 'i' } },
              { status: { $regex: search, $options: 'i' } }
            ]
          })
        }
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client',
          foreignField: '_id',
          as: 'clientInfo'
        }
      },
      {
        $lookup: {
          from: 'admins',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'performedByInfo'
        }
      },
      {
        $addFields: {
          activityType: 'order',
          activitySubType: '$status',
          description: {
            $concat: [
              'Order ', 
              { $toString: '$orderNumber' }, 
              ' - ', 
              '$status',
              ' for ',
              { $ifNull: ['$doctorName', 'Unknown Doctor'] }
            ]
          },
          activityDate: '$createdAt',
          amount: { $ifNull: ['$totalAmount', 0] },
          clientInfo: { $arrayElemAt: ['$clientInfo', 0] },
          performedByInfo: { $arrayElemAt: ['$performedByInfo', 0] }
        }
      }
    ];

    // Invoices data
    const invoicesPipeline = [
      {
        $match: {
          ...(Object.keys(dateFilter).length && { created: dateFilter }),
          ...(client && { 'client': new mongoose.Types.ObjectId(client) }),
          ...(search && {
            $or: [
              { number: { $regex: search, $options: 'i' } },
              { status: { $regex: search, $options: 'i' } },
              { paymentStatus: { $regex: search, $options: 'i' } }
            ]
          }),
          ...(minAmount && { total: { $gte: parseFloat(minAmount) } }),
          ...(maxAmount && { total: { $lte: parseFloat(maxAmount) } })
        }
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'client',
          foreignField: '_id',
          as: 'clientInfo'
        }
      },
      {
        $lookup: {
          from: 'admins',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'performedByInfo'
        }
      },
      {
        $addFields: {
          activityType: 'invoice',
          activitySubType: '$paymentStatus',
          description: {
            $concat: [
              'Invoice #', 
              { $toString: '$number' }, 
              ' - ', 
              '$paymentStatus',
              ' (', 
              '$status', 
              ')'
            ]
          },
          activityDate: '$created',
          amount: { $ifNull: ['$total', 0] },
          clientInfo: { $arrayElemAt: ['$clientInfo', 0] },
          performedByInfo: { $arrayElemAt: ['$performedByInfo', 0] }
        }
      }
    ];

    // Returns data
    const returnsPipeline = [
      {
        $match: {
          ...(Object.keys(dateFilter).length && { createdAt: dateFilter }),
          ...(search && {
            $or: [
              { reason: { $regex: search, $options: 'i' } },
              { status: { $regex: search, $options: 'i' } }
            ]
          })
        }
      },
      {
        $lookup: {
          from: 'inventories',
          localField: 'originalItemId',
          foreignField: '_id',
          as: 'itemInfo'
        }
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'returnOrder',
          foreignField: '_id',
          as: 'orderInfo'
        }
      },
      {
        $lookup: {
          from: 'clients',
          localField: 'orderInfo.client',
          foreignField: '_id',
          as: 'clientInfo'
        }
      },
      {
        $lookup: {
          from: 'admins',
          localField: 'collectionMetadata.collectedBy',
          foreignField: '_id',
          as: 'performedByInfo'
        }
      },
      {
        $addFields: {
          activityType: 'return',
          activitySubType: '$status',
          description: {
            $concat: [
              'Return - ',
              { $arrayElemAt: ['$itemInfo.itemName', 0] },
              ' (Qty: ',
              { $toString: '$returnedQuantity' },
              ') - ',
              '$status'
            ]
          },
          activityDate: '$createdAt',
          amount: 0,
          clientInfo: { $arrayElemAt: ['$clientInfo', 0] },
          performedByInfo: { $arrayElemAt: ['$performedByInfo', 0] }
        }
      }
    ];

    // Execute all pipelines and combine results
    const [orders, invoices, returns] = await Promise.all([
      Order.aggregate(ordersPipeline),
      Invoice.aggregate(invoicesPipeline),
      Returns.aggregate(returnsPipeline)
    ]);

    // Combine all results
    let allActivities = [...orders, ...invoices, ...returns];

    // Apply activity type filter
    if (activityType && activityType !== 'all') {
      allActivities = allActivities.filter(activity => activity.activityType === activityType);
    }

    // Apply status filter
    if (status && status !== 'all') {
      allActivities = allActivities.filter(activity => activity.activitySubType === status);
    }

    // Apply amount filters
    if (minAmount) {
      allActivities = allActivities.filter(activity => activity.amount >= parseFloat(minAmount));
    }
    if (maxAmount) {
      allActivities = allActivities.filter(activity => activity.amount <= parseFloat(maxAmount));
    }

    // Sort by activity date (newest first)
    allActivities.sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));

    // Calculate pagination
    const total = allActivities.length;
    const totalPages = Math.ceil(total / limitNum);
    const paginatedActivities = allActivities.slice(skip, skip + limitNum);

    // Get summary statistics
    const summary = {
      totalActivities: total,
      totalOrders: orders.length,
      totalInvoices: invoices.length,
      totalReturns: returns.length,
      totalAmount: allActivities.reduce((sum, activity) => sum + (activity.amount || 0), 0),
      thisMonth: allActivities.filter(activity => {
        const activityMonth = new Date(activity.activityDate).getMonth();
        const currentMonth = new Date().getMonth();
        return activityMonth === currentMonth;
      }).length
    };

    res.json({
      success: true,
      result: paginatedActivities,
      pagination: {
        current: pageNum,
        pages: totalPages,
        total: total,
        limit: limitNum
      },
      summary
    });

  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

const getHistoryFilters = async (req, res) => {
  try {
    // Get unique clients
    const clients = await Client.find({ removed: false, enabled: true })
      .select('name _id')
      .sort({ name: 1 });

    // Get unique users who have performed actions
    const users = await Admin.find({ removed: false, enabled: true })
      .select('name _id')
      .sort({ name: 1 });

    // Get available years from existing data
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push(i);
    }

    // Activity types and their statuses
    const activityTypes = [
      { value: 'all', label: 'All Activities' },
      { value: 'order', label: 'Orders' },
      { value: 'invoice', label: 'Invoices' },
      { value: 'return', label: 'Returns' }
    ];

    const orderStatuses = [
      'pending', 'processing', 'picked_up', 'delivered', 'cancelled'
    ];

    const invoiceStatuses = [
      'draft', 'pending', 'sent', 'paid', 'overdue', 'cancelled'
    ];

    const returnStatuses = [
      'Available for reuse', 'Used', 'Damaged', 'Disposed'
    ];

    res.json({
      success: true,
      result: {
        clients,
        users,
        years,
        activityTypes,
        statuses: {
          order: orderStatuses,
          invoice: invoiceStatuses,
          return: returnStatuses
        }
      }
    });

  } catch (error) {
    console.error('Error fetching history filters:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

module.exports = {
  getHistory,
  getHistoryFilters
};

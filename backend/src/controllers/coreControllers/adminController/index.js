const createUserController = require('@/controllers/middlewaresControllers/createUserController');
const Admin = require('@/models/coreModels/Admin');

// Get the base controller (with updateProfile, read, etc.)
const adminController = createUserController('Admin');

// ✅ Extend it with a custom `list` method with pagination support
adminController.list = async (req, res) => {
  try {
    console.log('🔍 [AdminController] List method called with pagination support');
    console.log('🔍 [AdminController] Request user info:', {
      userId: req.user?._id,
      userRole: req.user?.role,
      userOrganizationId: req.user?.organizationId,
      userName: req.user?.name
    });
    console.log('🔍 [AdminController] Query params:', req.query);
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.items) || 10;
    const skip = page * limit - limit;
    
    // Base query: Handle both isDeleted: false and isDeleted: undefined/missing
    const baseQuery = {
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } },
        { isDeleted: undefined }
      ]
    };
    
    // Get organization filter if needed
    let organizationFilter = {};
    if (req.user?.role !== 'owner' && req.user?.organizationId) {
      console.log('🔍 [AdminController] Applying organization filtering for non-owner user');
      organizationFilter = {
        $or: [
          { organizationId: req.user.organizationId },
          { role: 'owner' } // Always include owners
        ]
      };
    }
    
    // Combine filters
    const finalQuery = { ...baseQuery, ...organizationFilter };
    
    console.log('🔍 [AdminController] Final query:', JSON.stringify(finalQuery, null, 2));
    
    // Execute paginated query
    const [admins, totalCount] = await Promise.all([
      Admin.find(finalQuery)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }) // Most recent first
        .exec(),
      Admin.countDocuments(finalQuery)
    ]);
    
    console.log('🔍 [AdminController] Paginated results:', {
      page,
      limit,
      skip,
      totalCount,
      returnedCount: admins.length,
      sampleData: admins.slice(0, 3).map(admin => ({
        _id: admin._id,
        name: admin.name,
        role: admin.role,
        organizationId: admin.organizationId,
        isDeleted: admin.isDeleted
      }))
    });
    
    const deliverers = admins.filter(admin => admin.role === 'deliverer');
    console.log(`✅ [AdminController] Page ${page} results: ${admins.length} admins, ${deliverers.length} deliverers`);
    console.log('📋 [AdminController] Roles found:', [...new Set(admins.map(admin => admin.role))]);
    console.log('🚚 [AdminController] Deliverer names:', deliverers.map(d => d.name));
    
    // Calculate pagination info
    const pages = Math.ceil(totalCount / limit);
    const pagination = { page, pages, count: totalCount };
    
    if (totalCount > 0) {
      return res.status(200).json({
        success: true,
        result: admins,
        pagination,
        message: 'Successfully found all documents'
      });
    } else {
      return res.status(203).json({
        success: true,
        result: [],
        pagination,
        message: 'Collection is Empty'
      });
    }
  } catch (error) {
    console.error('❌ [AdminController] Error fetching admins:', error);
    return res.status(500).json({
      success: false,
      result: [],
      message: error.message
    });
  }
};

module.exports = adminController;

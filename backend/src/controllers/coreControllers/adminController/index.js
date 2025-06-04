const createUserController = require('@/controllers/middlewaresControllers/createUserController');
const Admin = require('@/models/coreModels/Admin');

// Get the base controller (with updateProfile, read, etc.)
const adminController = createUserController('Admin');

// ✅ Extend it with a custom `list` method
adminController.list = async (req, res) => {
  try {
    const admins = await Admin.find({ isDeleted: false }); // or add { role: 'deliverer' } to filter
    return res.status(200).json({
      success: true,
      result: admins,
      message: 'Admins retrieved successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: [],
      message: error.message
    });
  }
};

module.exports = adminController;

const mongoose = require('mongoose');
// const Joi = require('joi'); // temporarily not used
const authUser = require('./authUser');

const login = async (req, res, { userModel }) => {
  const UserPasswordModel = mongoose.model(userModel + 'Password');
  const UserModel = mongoose.model(userModel);
  const { email, password } = req.body;

  console.log('Login request body:', req.body);

  // --- TEMPORARY: Skip Joi validation for testing
  if (!email || !password) {
    return res.status(409).json({
      success: false,
      result: null,
      message: 'Missing email or password',
    });
  }

  try {
    const user = await UserModel.findOne({ email: email, removed: false });
    console.log('User found:', user);

    if (!user) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'No account with this email has been registered.',
      });
    }

    const databasePassword = await UserPasswordModel.findOne({
      user: user._id,
      removed: false,
    });
    console.log('User password record:', databasePassword);

    if (!databasePassword) {
      return res.status(404).json({
        success: false,
        result: null,
        message: 'Password record not found for this user.',
      });
    }

    if (!user.enabled) {
      return res.status(409).json({
        success: false,
        result: null,
        message: 'Your account is disabled, contact your account administrator',
      });
    }

    // 🔐 Proceed to password auth
    authUser(req, res, {
      user,
      databasePassword,
      password,
      UserPasswordModel,
    });
  } catch (error) {
    return res.status(503).json({
      success: false,
      result: null,
      message: error.message,
      error: error,
    });
  }
};

module.exports = login;

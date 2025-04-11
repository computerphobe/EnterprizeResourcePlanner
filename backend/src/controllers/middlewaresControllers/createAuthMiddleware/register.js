const Admin = require("@/models/coreModels/Admin");
const AdminPassword = require("@/models/coreModels/AdminPassword");
const bcrypt = require("bcryptjs");

console.log("register endpoint hit");

const register = async (req, res) => {
    const { name, surname, email, password, role } = req.body;
    console.log("register endpoint hit", req.body);
    
    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required.',
      });
    }
  
    const existingUser = await Admin.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already in use.',
      });
    }
  
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(salt + password, 10);
  
    const newUser = new Admin({
      name,
      surname,
      email,
      role,
    });
  
    await newUser.save();
  
    const userPassword = new AdminPassword({
      user: newUser._id,
      password: hashedPassword,
      salt,
    });
  
    await userPassword.save();
  
    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      result: {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  };

  module.exports = register;
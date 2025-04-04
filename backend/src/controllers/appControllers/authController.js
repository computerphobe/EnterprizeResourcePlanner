const register = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      role,
      hospitalName,
      specialization,
      registrationNumber
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email, isDeleted: false });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        result: null,
        message: 'Email already exists'
      });
    }

    // Create new user
    const newUser = new User({
      email,
      password: await bcrypt.hash(password, 10),
      name,
      role,
      ...(role === 'doctor' && {
        hospitalName,
        specialization,
        registrationNumber
      })
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      result: {
        _id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      },
      message: 'User created successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message
    });
  }
}; 
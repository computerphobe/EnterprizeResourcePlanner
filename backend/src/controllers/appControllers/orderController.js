const create = async (req, res) => {
  try {
    const { orderType, doctorId, doctorName, hospitalName, ...orderData } = req.body;
    
    const newOrder = new Order({
      ...orderData,
      orderType: orderType || 'admin',
      ...(orderType === 'doctor' && {
        doctorId,
        doctorName,
        hospitalName
      }),
      createdBy: req.user._id
    });

    await newOrder.save();
    
    return res.status(201).json({
      success: true,
      result: newOrder,
      message: "Order created successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message
    });
  }
};

const list = async (req, res) => {
  try {
    const orders = await Order.find({ isDeleted: false })
      .populate('items.inventoryItem')
      .populate('doctorId', 'name hospitalName')
      .sort('-createdAt');

    return res.status(200).json({
      success: true,
      result: orders,
      message: "Orders retrieved successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message
    });
  }
}; 
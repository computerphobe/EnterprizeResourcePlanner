const mongoose = require('mongoose');

const Model = mongoose.model('Invoice');

const read = async (req, res) => {
  const result = await Model.findOne({
    _id: req.params.id,
    removed: false,
  })
    .populate('createdBy', 'name')
    .populate('client') // ✅ Add this line to populate client details
    .exec();

  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No document found ',
    });
  } else {
    return res.status(200).json({
      success: true,
      result,
      message: 'we found this document ',
    });
  }
};

module.exports = read;

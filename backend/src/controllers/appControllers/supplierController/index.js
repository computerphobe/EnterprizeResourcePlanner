const Supplier = require('@/models/appModels/Supplier');
console.log('Supplier Controller loaded successfully!')

const list = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ isDeleted: false });
    return res.status(200).json({
      success: true,
      result: suppliers,
      message: "Successfully fetched suppliers list",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

const create = async (req, res) => {
  try {
    const newSupplier = new Supplier(req.body);
    const savedSupplier = await newSupplier.save();
    return res.status(201).json({
      success: true,
      result: savedSupplier,
      message: "Successfully created supplier",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    return res.status(200).json({
      success: true,
      result: updatedSupplier,
      message: "Successfully updated supplier",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

const remove = async (req, res) => {
  try {
    await Supplier.findByIdAndUpdate(req.params.id, { isDeleted: true });
    return res.status(200).json({
      success: true,
      result: null,
      message: "Successfully deleted supplier",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      result: null,
      message: error.message,
    });
  }
};

module.exports = {
  list,
  create,
  update,
  delete: remove
};

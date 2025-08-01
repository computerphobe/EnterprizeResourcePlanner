const express = require('express');
const router = express.Router();
const expenseController = require('../../controllers/appControllers/expenseController');
const { verifyAuth } = require('../../middlewares/authMiddleware'); // Adjust path if needed

// For file upload middleware (like multer), if you use it
const multer = require('multer');
const upload = multer({ 
  dest: 'uploads/bills/',
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
    files: 10, // Allow up to 10 files
    fieldSize: 100 * 1024 * 1024, // 100MB field size
  }
});

router.use(verifyAuth);

router.post('/', upload.single('bill'), expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.delete('/:id', expenseController.deleteExpense);
router.get('/net-profit', expenseController.calculateNetProfit);

module.exports = router;

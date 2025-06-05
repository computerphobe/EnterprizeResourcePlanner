const express = require('express');
const router = express.Router();
const expenseController = require('../../controllers/appControllers/expenseController');
const { verifyAuth } = require('../../middlewares/authMiddleware'); // Adjust path if needed

// For file upload middleware (like multer), if you use it
const multer = require('multer');
const upload = multer({ dest: 'uploads/bills/' }); // or your config

router.use(verifyAuth);

router.post('/', upload.single('bill'), expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.delete('/:id', expenseController.deleteExpense);
router.get('/net-profit', expenseController.calculateNetProfit);

module.exports = router;

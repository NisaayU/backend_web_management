const express = require('express');
const router = express.Router();

const { addExpense, getExpenses, deleteExpense, updateExpense } = require('../controllers/expense');
const { addIncome, getIncomes, deleteIncome, searchIncome, getMinMaxByDate, updateIncome } = require('../controllers/income');
const { loginUser, getProfile, createUser, deleteUser, updatePassword, getUsers } = require('../controllers/user');
const { protect, authorizeOwner } = require('../middleware/authMiddleware');
const { addItem, getItems, updateItem, deleteItem } = require("../controllers/item");
const { exportIncomeToExcel } = require('../controllers/reportControllers');

// INCOME
router.post('/add-income', addIncome);
router.get('/get-incomes', getIncomes);
router.delete('/delete-income/:id', deleteIncome);
router.get('/search', searchIncome);
router.get('/export', exportIncomeToExcel);
router.put('/update-income/:id', updateIncome);

// EXPENSE
router.post('/add-expense', addExpense);
router.get('/get-expenses', getExpenses);
router.put('/update-expense/:id', updateExpense);
router.delete('/delete-expense/:id', deleteExpense);

// USER
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);

// USER — khusus owner
router.get('/users', protect, authorizeOwner, getUsers);
router.put('/users/:id/password', protect, authorizeOwner, updatePassword);
router.post('/users', protect, authorizeOwner, createUser);
router.delete('/users/:id', protect, authorizeOwner, deleteUser);

// ITEM
router.post("/items", addItem);
router.get("/items", getItems);
router.put("/item/:id", updateItem);
router.delete("/item/:id", deleteItem);

module.exports = router;
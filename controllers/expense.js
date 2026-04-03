const ExpenseSchema = require("../models/ExpenseModel");

// ADD EXPENSE
exports.addExpense = async (req, res) => {
    try {
        const { title, amount, category, description, date } = req.body;

        if (!title || !category || !description || !date) {
            return res.status(400).json({ message: 'All fields are required!' });
        }

        if (Number(amount) <= 0) {
            return res.status(400).json({ message: 'Amount must be positive' });
        }

        const expense = new ExpenseSchema({
            title,
            amount,
            category,
            description,
            date
        });

        await expense.save();
        return res.status(200).json({ message: 'Expense Added' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server Error' });
    }
};

// GET EXPENSES
exports.getExpenses = async (req, res) => {
    try {
        const expenses = await ExpenseSchema.find().sort({ createdAt: -1 });
        return res.status(200).json(expenses);
    } catch (error) {
        return res.status(500).json({ message: 'Server Error' });
    }
};

// UPDATE EXPENSE
exports.updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, amount, category, description, date } = req.body;

        if (!title || !category || !date) {
            return res.status(400).json({ message: 'Title, category, and date are required!' });
        }

        if (Number(amount) <= 0) {
            return res.status(400).json({ message: 'Amount must be positive' });
        }

        const updated = await ExpenseSchema.findByIdAndUpdate(
            id,
            { title, amount: Number(amount), category, description, date },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        return res.status(200).json({ message: 'Expense Updated', data: updated });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server Error' });
    }
};

// DELETE EXPENSE
exports.deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("DELETE ID:", id);
        await ExpenseSchema.findByIdAndDelete(id);
        return res.status(200).json({ message: 'EXPENSE DELETED' });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error' });
    }
};
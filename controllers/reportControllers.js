const IncomeSchema = require("../models/IncomeModel");
const ExpenseSchema = require("../models/ExpenseModel"); 
const XLSX = require('xlsx');

exports.exportIncomeToExcel = async (req, res) => {
    try {
        const { buyer, date, product } = req.query;

        // ── FILTER INCOME ──
        let incomeQuery = {};
        if (buyer)   incomeQuery.title       = { $regex: buyer, $options: 'i' };
        if (product) incomeQuery['items.name'] = { $regex: product, $options: 'i' };
        if (date) {
            const start = new Date(date); start.setHours(0, 0, 0, 0);
            const end   = new Date(date); end.setHours(23, 59, 59, 999);
            incomeQuery.date = { $gte: start, $lte: end };
        }

        // ── FILTER EXPENSE ──
        let expenseQuery = {};
        if (date) {
            const start = new Date(date); start.setHours(0, 0, 0, 0);
            const end   = new Date(date); end.setHours(23, 59, 59, 999);
            expenseQuery.date = { $gte: start, $lte: end };
        }

        // ── FETCH DATA ──
        const incomes  = await IncomeSchema.find(incomeQuery).sort({ createdAt: -1 });
        const expenses = await ExpenseSchema.find(expenseQuery).sort({ createdAt: -1 });

        // ── FORMAT INCOME ──
        const formattedIncome = incomes.map(d => ({
            Tanggal: new Date(d.date).toLocaleDateString('id-ID'),
            Pembeli: d.title || '-',
            Item:    d.items.map(i => `${i.name} (${i.quantity} pcs)`).join(', '),
            Total:   d.total,
        }));

        // ── FORMAT EXPENSE ──
        const categoryLabel = { groceries: 'Pengantaran Barang', tv: 'Belanja Stok', other: 'Lainnya' };
        const formattedExpense = expenses.map(d => ({
            Tanggal:    new Date(d.date).toLocaleDateString('id-ID'),
            Nama:       d.title || '-',
            Kategori:   categoryLabel[d.category] || d.category || '-',
            Keterangan: d.description || '-',
            Jumlah:     d.amount || d.total || 0,
        }));

        // ── BUILD WORKBOOK ──
        const workbook = XLSX.utils.book_new();

        const wsIncome  = XLSX.utils.json_to_sheet(formattedIncome);
        wsIncome['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 45 }, { wch: 15 }];

        const wsExpense = XLSX.utils.json_to_sheet(formattedExpense);
        wsExpense['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 15 }];

        XLSX.utils.book_append_sheet(workbook, wsIncome,  'Penjualan');
        XLSX.utils.book_append_sheet(workbook, wsExpense, 'Pengeluaran');

        // ── SEND ──
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        const label = date
            ? new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
            : 'Semua';

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Laporan Keuangan ${label}.xlsx"`);
        res.send(buffer);

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Export failed' });
    }
};
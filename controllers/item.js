const ItemSchema = require("../models/ItemModel");
const IncomeSchema = require("../models/IncomeModel");

exports.addItem = async (req, res) => {
    try {
        const { name, price, stock } = req.body;

        // Validasi wajib - stock agar income controller bisa kurangi stok
        if (!name || price === undefined || stock === undefined) {
            return res.status(400).json({ message: "Nama, harga, dan stok wajib diisi" });
        }

        if (price <= 0) {
            return res.status(400).json({ message: "Harga harus lebih dari 0" });
        }

        if (stock < 0) {
            return res.status(400).json({ message: "Stok tidak boleh negatif" });
        }

        const item = await ItemSchema.create({ name, price, stock });

        res.status(201).json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.getItems = async (req, res) => {
    try {
        const items = await ItemSchema.find().sort({ createdAt: -1 });
        res.status(200).json(items);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;

        // Whitelist field yang boleh diupdate 
        const { name, price, stock } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (price !== undefined) {
            if (price <= 0) return res.status(400).json({ message: "Harga harus lebih dari 0" });
            updateData.price = price;
        }
        if (stock !== undefined) {
            if (stock < 0) return res.status(400).json({ message: "Stok tidak boleh negatif" });
            updateData.stock = stock;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "Tidak ada field yang diupdate" });
        }

        const item = await ItemSchema.findByIdAndUpdate(id, updateData, { new: true });

        if (!item) {
            return res.status(404).json({ message: "Item tidak ditemukan" });
        }

        res.status(200).json(item);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await ItemSchema.findById(id);
        if (!item) {
            return res.status(404).json({ message: "Item tidak ditemukan" });
        }

        // Cegah hapus item yang masih dipakai di transaksi income
        const usedInIncome = await IncomeSchema.findOne({ "items.item": id });
        if (usedInIncome) {
            return res.status(400).json({
                message: "Item tidak bisa dihapus karena masih digunakan dalam transaksi income"
            });
        }

        await ItemSchema.findByIdAndDelete(id);
        res.status(200).json({ message: "Item berhasil dihapus" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};
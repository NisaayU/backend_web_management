const IncomeSchema = require("../models/IncomeModel");
const Item = require("../models/ItemModel");

exports.addIncome = async (req, res) => {
    const { date, title, items, description, type } = req.body;

    // Validasi utama
    if (!date || !items || items.length === 0) {
        return res.status(400).json({ message: 'Date and items are required!' });
    }

    // Validasi item: setiap item harus punya item ID dan quantity > 0
    for (let i of items) {
        if (!i.item || i.quantity <= 0) {
            return res.status(400).json({
                message: 'Each item must have item ID and quantity > 0'
            });
        }
    }

    try {
        // Validasi stok semua item terlebih dahulu sebelum melakukan perubahan apapun
        const productCache = {};
        for (let i of items) {
            const product = await Item.findById(i.item);
            if (!product) {
                return res.status(404).json({ message: `Item with ID ${i.item} not found` });
            }
            if (product.stock < i.quantity) {
                return res.status(400).json({
                    message: `Stock not enough for ${product.name}. Available: ${product.stock}, requested: ${i.quantity}`
                });
            }
            // Cache product agar tidak query ulang
            productCache[i.item] = product;
        }

        // Kurangi stok dan buat processedItems
        let total = 0;
        const processedItems = [];

        for (let i of items) {
            const product = productCache[i.item];

            product.stock -= i.quantity;
            await product.save();

            const subtotal = product.price * i.quantity;
            total += subtotal;

            processedItems.push({
                item: product._id,
                name: product.name,
                quantity: i.quantity,
                price: product.price,
                subtotal
            });
        }

        const income = new IncomeSchema({
            date,
            title,
            items: processedItems,
            total,
            description,
            type
        });

        await income.save();
        res.status(201).json({ message: 'Income Added Successfully', data: income });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getIncomes = async (req, res) => {
    try {
        const incomes = await IncomeSchema.find().sort({ createdAt: -1 });
        res.status(200).json(incomes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.deleteIncome = async (req, res) => {
    const { id } = req.params;
    try {
        const income = await IncomeSchema.findById(id);
        if (!income) {
            return res.status(404).json({ message: 'Income not found' });
        }

        // Kembalikan stok barang yang terjual
        for (let i of income.items) {
            const product = await Item.findById(i.item);
            if (product) {
                product.stock += i.quantity;
                await product.save();
            }
        }

        await IncomeSchema.findByIdAndDelete(id);
        res.status(200).json({ message: 'Income Deleted Successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.updateIncome = async (req, res) => {
    const { id } = req.params;
    const { date, title, items, description, type } = req.body;

    if (!date || !items || items.length === 0) {
        return res.status(400).json({ message: 'Date and items are required!' });
    }

    // Resolve nama 
    for (let i of items) {
        const isValidObjectId = i.item && /^[a-f\d]{24}$/i.test(String(i.item));
        if (!isValidObjectId) {
            const found = await Item.findOne({ name: i.name || i.product });
            if (!found) {
                return res.status(404).json({
                    message: `Produk "${i.name || i.product}" tidak ditemukan`
                });
            }
            i.item = found._id;
        }
    }

    // Validasi quantity
    for (let i of items) {
        if (!i.item || !i.quantity || i.quantity <= 0) {
            return res.status(400).json({ message: 'Each item must have item ID and quantity > 0' });
        }
    }

    try {
        const existingIncome = await IncomeSchema.findById(id);
        if (!existingIncome) {
            return res.status(404).json({ message: 'Income not found' });
        }

        // 1. Kembalikan stok lama
        for (let i of existingIncome.items) {
            const product = await Item.findById(i.item);
            if (product) {
                product.stock += i.quantity;
                await product.save();
            }
        }

        // 2. Validasi stok baru
        const productCache = {};
        for (let i of items) {
            const product = await Item.findById(i.item);
            if (!product) {
                // Rollback
                for (let old of existingIncome.items) {
                    const p = await Item.findById(old.item);
                    if (p) { p.stock -= old.quantity; await p.save(); }
                }
                return res.status(404).json({ message: `Item tidak ditemukan` });
            }
            if (product.stock < i.quantity) {
                // Rollback
                for (let old of existingIncome.items) {
                    const p = await Item.findById(old.item);
                    if (p) { p.stock -= old.quantity; await p.save(); }
                }
                return res.status(400).json({
                    message: `Stok ${product.name} tidak cukup. Tersedia: ${product.stock}, diminta: ${i.quantity}`
                });
            }
            productCache[String(i.item)] = product;
        }

        // 3. Kurangi stok baru & buat processedItems
        let total = 0;
        const processedItems = [];

        for (let i of items) {
            const product = productCache[String(i.item)];
            product.stock -= i.quantity;
            await product.save();

            const subtotal = product.price * i.quantity;
            total += subtotal;

            processedItems.push({
                item:     product._id,
                name:     product.name,
                quantity: i.quantity,
                price:    product.price,
                subtotal
            });
        }

        const updatedIncome = await IncomeSchema.findByIdAndUpdate(
            id,
            { date, title, items: processedItems, total, description, type },
            { new: true }
        );

        res.status(200).json({ message: 'Income Updated Successfully', data: updatedIncome });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.searchIncome = async (req, res) => {
    const { buyer, date, product } = req.query;

    let query = { type: 'income' };

    if (buyer) {
        query.title = { $regex: buyer, $options: 'i' };
    }

    if (date) {
        const start = new Date(date);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        query.date = { $gte: start, $lte: end };
    }

    if (product) {
        query['items.name'] = { $regex: product, $options: 'i' };
    }

    try {
        const data = await IncomeSchema.find(query).sort({ createdAt: -1 });
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Search failed' });
    }
};

exports.getMinMaxByDate = async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ message: 'Date is required' });
    }

    try {
        const start = new Date(date);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        const result = await IncomeSchema.aggregate([
            { $match: { date: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: null,
                    maxTransaction: { $max: '$total' },
                    minTransaction: { $min: '$total' }
                }
            }
        ]);

        if (!result || result.length === 0) {
            return res.status(404).json({ message: 'No data found for the given date' });
        }

        res.status(200).json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};
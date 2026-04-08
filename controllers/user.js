const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");

/* ================= LOGIN ================= */
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username dan password wajib diisi" });
        }

        const user = await User.findOne({ username: username.toLowerCase().trim() });

        if (!user) {
            return res.status(401).json({ message: "Username atau password salah" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Username atau password salah" });
        }

        res.status(200).json({
            _id: user._id,
            username: user.username,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

/* ================= GET PROFILE ================= */
const getProfile = async (req, res) => {
    try {
        res.status(200).json({
            _id: req.user._id,
            username: req.user.username,
            role: req.user.role,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

/* ================= UPDATE PASSWORD (owner only) ================= */
const updatePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ message: "Password minimal 4 karakter" });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ message: `Password ${user.username} berhasil diupdate` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

/* ================= GET ALL USERS (owner only) ================= */
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}, "-password").sort({ role: 1, username: 1 });
        res.status(200).json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

/* ================= CREATE USER (owner only) ================= */
const createUser = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username dan password wajib diisi" });
        }

        if (password.length < 4) {
            return res.status(400).json({ message: "Password minimal 4 karakter" });
        }

        const exists = await User.findOne({ username: username.toLowerCase().trim() });
        if (exists) {
            return res.status(400).json({ message: "Username sudah digunakan" });
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            username: username.toLowerCase().trim(),
            password: hashed,
            role: role === "owner" ? "owner" : "staff", // default staff
        });

        res.status(201).json({
            _id:      user._id,
            username: user.username,
            role:     user.role,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

/* ================= DELETE USER (owner only) ================= */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Owner tidak bisa hapus dirinya sendiri
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "Tidak bisa menghapus akun sendiri" });
        }

        await User.findByIdAndDelete(id);
        res.status(200).json({ message: `User ${user.username} berhasil dihapus` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

/* ================= SEED DEFAULT USERS ================= */
/**
 * Default credentials:
 *   owner  → username: "owner"  | password: "owner123"
 *   staff  → username: "staff"  | password: "staff123"
 */
const seedDefaultUsers = async () => {
    try {
        const defaults = [
            { username: "owner", password: "owner123", role: "owner" },
            { username: "staff", password: "staff123", role: "staff" },
        ];

        for (const u of defaults) {
            const exists = await User.findOne({ username: u.username });
            if (!exists) {
                const hashed = await bcrypt.hash(u.password, 10);
                await User.create({ username: u.username, password: hashed, role: u.role });
                console.log(`✅ Default user created: ${u.username} (${u.role})`);
            } else {
                console.log(`ℹ️  User already exists: ${u.username}`);
            }
        }
    } catch (error) {
        console.error("❌ Error seeding default users:", error);
    }
};

module.exports = {
    loginUser,
    getProfile,
    createUser,
    deleteUser,
    updatePassword,
    getUsers,
    seedDefaultUsers,
};
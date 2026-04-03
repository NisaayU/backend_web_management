const jwt = require("jsonwebtoken");
const User = require("../models/User");

/* ── Cek token JWT ── */
const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Tidak terotorisasi, token tidak ada" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Ambil user tanpa password
        req.user = await User.findById(decoded.id).select("-password");

        if (!req.user) {
            return res.status(401).json({ message: "User tidak ditemukan" });
        }

        next();
    } catch (error) {
        res.status(401).json({ message: "Token tidak valid atau sudah expired" });
    }
};

/* ── Hanya owner yang boleh akses ── */
const authorizeOwner = (req, res, next) => {
    if (req.user && req.user.role === "owner") {
        return next();
    }
    res.status(403).json({ message: "Akses ditolak. Hanya owner yang bisa melakukan ini." });
};

module.exports = { protect, authorizeOwner };
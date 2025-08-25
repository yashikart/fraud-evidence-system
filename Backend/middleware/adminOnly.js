const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log("=== 🔐 ADMIN ONLY CHECK ===");

  let user = req.user;

  // Fallback: Try to decode JWT manually if req.user is not set
  if (!user) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user; // assign for future use
        console.log("ℹ️ Decoded user from token:", user.email || user.id);
      } catch (err) {
        console.log("❌ Invalid token:", err.message);
        return res.status(403).json({ error: "Admin access required" });
      }
    }
  }

  if (!user || user.role !== "admin") {
    console.log("❌ Admin access denied for user:", user?.email || "unknown");
    return res.status(403).json({ error: "Admin access required" });
  }

  console.log("✅ Admin access granted to:", user.email || user.id);
  next();
};

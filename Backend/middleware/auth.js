//middleware/auth.js
const jwt = require("jsonwebtoken");

const publicRoutes = [
  "/api/escalate",
  "/simulate-rbi-alert",
  "/health",
  "/test"
];

module.exports = (req, res, next) => {
  if (publicRoutes.includes(req.path)) {
    console.log("🔓 Public route, skipping auth:", req.path);
    return next();
  }

  console.log("=== AUTH DEBUG ===");
  const authHeader = req.headers["authorization"];
  console.log("Authorization header:", authHeader);

  if (!authHeader) {
    console.log("❌ Missing Authorization header");
    return res.status(403).json({ message: "No authorization header" });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    console.log("❌ Invalid Authorization format");
    return res.status(403).json({ message: "Invalid authorization format" });
  }

  try {
    const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("❌ JWT secret not defined in environment");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const payload = jwt.verify(token, jwtSecret, {
      issuer: `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co/auth/v1`
    });

    console.log("✅ JWT verified:", {
      email: payload.email,
      role: payload.role,
      sub: payload.sub
    });

    req.user = {
      email: payload.email,
      role: payload.role,
      sub: payload.sub
    };

    next();
  } catch (err) {
    console.error("❌ JWT verification failed:", err.message);
    return res.status(403).json({ message: "Invalid token" });
  }
};

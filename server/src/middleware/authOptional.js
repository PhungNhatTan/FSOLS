import jwt from "jsonwebtoken";

/**
 * Optional authentication middleware.
 *
 * - If an Authorization Bearer token is present and valid, sets req.user.
 * - If no token is present, continues without setting req.user.
 * - If a token is present but invalid/expired, returns 403.
 */
export default function authenticateOptional(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Invalid or expired token: " + err });
  }
}

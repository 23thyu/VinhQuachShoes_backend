import jwt from "jsonwebtoken";
import db from "../models";
const JWT_SECRET = process.env.JWT_SECRET;

// Hàm kiểm tra và lấy thông tin người dùng từ token
async function getUserFromToken(req) {
  let authHeader = req.headers.authorization || req.headers.http_authorization || req.headers["x-access-token"];
  
  if (!authHeader && req.headers.authorization) {
    authHeader = req.headers.authorization;
  }

  if (!authHeader) {
    throw new Error("Không có token được cung cấp");
  }

  let token = authHeader;
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await db.User.findByPk(decoded.id);

  if (!user) {
    throw new Error("Người dùng không tồn tại");
  }

  if (
    user.password_changed_at &&
    decoded.iat < new Date(user.password_changed_at).getTime() / 1000
  ) {
    throw new Error("Token không hợp lệ do mật khẩu đã thay đổi");
  }

  return user; // Trả về thông tin người dùng nếu token hợp lệ và người dùng tồn tại
}
module.exports = { getUserFromToken };

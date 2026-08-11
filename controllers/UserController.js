import { Sequelize, where } from "sequelize";
const { Op } = Sequelize;
import db from "../models";
import ResponseUser from "../dtos/responses/ResponsesUsers";
import InsertUserRequest from "../dtos/requests/user/InsertUserRequest";
import argon2 from "argon2";
import UserRole from "../constants/UserRole";
import jwt from "jsonwebtoken";
import { GetImageURL } from "../helpers/imageHelper.js";
require("dotenv").config();

export const registerUser = async (req, res) => {
  const { email, phone, password } = req.body;
  if (!email && !phone) {
    return res.status(400).json({
      message: "Email hoặc số điện thoại là bắt buộc",
    });
  }
  const conditions = [];
  if (email) {
    conditions.push({ email });
  }
  if (phone) {
    conditions.push({ phone });
  }
  if (conditions.length > 0) {
    const existingUser = await db.User.findOne({
      where: {
        [Op.or]: conditions,
      },
    });
    if (existingUser) {
      if (email && existingUser.email === email && phone && existingUser.phone === phone) {
        return res.status(409).json({
          message: "Cả Email và Số điện thoại đã được đăng ký",
        });
      }
      if (email && existingUser.email === email) {
        return res.status(409).json({
          message: "Email đã được đăng ký bởi tài khoản khác",
        });
      }
      if (phone && existingUser.phone === phone) {
        return res.status(409).json({
          message: "Số điện thoại đã được đăng ký bởi tài khoản khác",
        });
      }
    }
  }
  const hashedPassword = password ? await argon2.hash(password) : null;
  const user = await db.User.create({
    ...req.body,
    email,
    phone,
    role: UserRole.USER,
    password: hashedPassword,
  });
  return res.status(201).json({
    message: "Đăng ký người dùng thành công",
    data: new ResponseUser(user),
  });

  // // Directly attempt to create a user with the provided request body
  // const existingUser = await db.User.findOne({
  //   where: { email: req.body.email },
  // });
  // if (existingUser) {
  //   return res.status(409).json({
  //     message: "Email đã tồn tại ",
  //   });
  // }
  // const hashedPassword = await argon2.hash(req.body.password);
  // const user = await db.User.create({ ...req.body, password: hashedPassword });
  // if (user) {
  //   return res.status(201).json({
  //     message: "Thêm mới người dùng thành công",
  //     data: new ResponseUser(user),
  //   });
  // } else {
  //   return res.status(400).json({
  //     message: "Không thể thêm người dùng",
  //   });
  // }
};
export const loginUser = async (req, res) => {
  const { email, phone, password } = req.body;
  if (!email && !phone) {
    return res.status(400).json({
      message: "Email hoặc số điện thoại là bắt buộc",
    });
  }
  const condition = {};
  if (email) {
    condition.email = email;
  }
  if (phone) {
    condition.phone = phone;
  }
  const user = await db.User.findOne({
    where: condition,
  });
  if (!user) {
    return res.status(404).json({
      message: "Người dùng không tìm thấy",
    });
  }
  const isPasswordValid =
    password && (await argon2.verify(user.password, password));
  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Mật khẩu không đúng",
    });
  }
  const token = jwt.sign(
    {
      id: user.id, //most important
      //role: user.role,
      iat: Math.floor(Date.now() / 1000),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );
  return res.status(200).json({
    message: "Đăng nhập thành công",
    data: { user: new ResponseUser(user), token },
  });
};
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, avatar, old_password, new_password, phone, address, city } = req.body;

  // Kiểm tra xem người dùng có đang cố gắng cập nhật thông tin của người dùng khác không
  if (req.user.id != id) {
    return res.status(403).json({
      message: "Không được phép cập nhật thông tin của người dùng khác",
    });
  }

  const user = await db.User.findByPk(id);
  if (!user) {
    return res.status(404).json({
      message: "Người dùng không tìm thấy",
    });
  }

  // Cập nhật mật khẩu nếu cần
  if (new_password && old_password) {
    // Kiểm tra mật khẩu cũ
    const passwordValid = await argon2.verify(user.password, old_password);
    if (!passwordValid) {
      return res.status(401).json({
        message: "Mật khẩu cũ không chính xác",
      });
    }

    // Hash mật khẩu mới
    user.password = await argon2.hash(new_password);
    user.password_changed_at = new Date();
  } else if (new_password || old_password) {
    // Nếu chỉ có một trong hai trường mật khẩu mới hoặc cũ được gửi lên
    return res.status(400).json({
      message: "Cần cả mật khẩu mới và mật khẩu cũ để cập nhật mật khẩu",
    });
  }

  // Cập nhật thông tin cá nhân
  user.name = name || user.name; // Cập nhật tên nếu có
  user.phone = phone || user.phone; // Cập nhật số điện thoại nếu có
  user.address = address !== undefined ? address : user.address; // Cập nhật địa chỉ nếu có
  user.city = city !== undefined ? city : user.city; // Cập nhật thành phố nếu có
  user.avatar = avatar || user.avatar; // Lưu tên file/URL gốc, không resolve tại đây

  await user.save();

  return res.status(200).json({
    message: "Cập nhật người dùng thành công",
    data: {
      ...new ResponseUser(user),
      avatar: GetImageURL(user.avatar), // Chỉ resolve URL khi trả ra client
    },
  });
};

export const getUsers = async (req, res) => {
  const users = await db.User.findAll();
  return res.status(200).json({
    message: "Lấy danh sách người dùng thành công",
    data: users.map(user => new ResponseUser(user)),
  });
};

export const adminUpdateUser = async (req, res) => {
  const { id } = req.params;
  const { role, is_locked } = req.body;
  try {
    const user = await db.User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tìm thấy" });
    }
    if (role !== undefined) user.role = Number(role);
    if (is_locked !== undefined) user.is_locked = Number(is_locked);
    await user.save();
    return res.status(200).json({
      message: "Cập nhật thông tin người dùng thành công",
      data: new ResponseUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi khi cập nhật người dùng", error: error.message });
  }
};


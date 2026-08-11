import { argon2d } from "argon2";
import Joi from "joi";
import { argon2 } from "argon2";
import UserRole from "../../../constants/UserRole";
// import bcrypt from "bcryptjs";

class InsertUserRequest {
  constructor(data) {
    this.email = data.email;
    this.password = data.password; // Encrypt password using bcrypt
    this.name = data.name;
    this.role = data.role;
    this.avatar = data.avatar;
    this.phone = data.phone;
  }

  static validate(data) {
    const schema = Joi.object({
      email: Joi.string().email().optional(),
      password: Joi.string().min(6).optional(), // dùng để đăng nhập fb GG
      name: Joi.string().required(),
      avatar: Joi.string().uri().allow("").optional(), // Optional and must be a URI
      phone: Joi.string().optional(), // Optional field for phone numbers
    });

    return schema.validate(data); // Returns { error, value }
  }
}

export default InsertUserRequest;

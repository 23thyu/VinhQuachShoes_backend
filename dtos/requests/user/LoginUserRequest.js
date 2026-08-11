import Joi from "joi";
// import bcrypt from "bcryptjs";
class loginUserRequest {
  constructor(data) {
    this.email = data.email;
    this.password = data.password; // Encrypt password using bcrypt
    this.phone = data.phone;
  }

  static validate(data) {
    const schema = Joi.object({
      email: Joi.string().email().optional(),
      password: Joi.string().min(6).required(), // Ensure password has a minimum length
      phone: Joi.string().optional(), // Optional field for phone numbers
    }).or("email", "phone");

    return schema.validate(data); // Returns { error, value }
  }
}

export default loginUserRequest;

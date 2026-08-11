import Joi from "joi";

class InsertCartRequest {
  constructor(data) {
    this.user_id = data.user_id;
    this.session_id = data.session_id;
  }

  static validate(data) {
    const schema = Joi.object({
      user_id: Joi.number().integer().optional(),
      session_id: Joi.string().optional(),
    }).or("user_id", "session_id"); // Phải có ít nhất một trong hai

    return schema.validate(data);
  }
}

export default InsertCartRequest;

import Joi from "joi";

class UpdateOrderRequest {
  constructor(data) {
    this.status = data.status;
    this.note = data.note;
    this.total = data.total;
  }

  static validate(data) {
    const schema = Joi.object({
      status: Joi.alternatives().try(
        Joi.number().integer().min(1).max(7),
        Joi.string().valid("Pending", "Shipped", "Delivered", "Cancelled", "Processing", "Shipping", "Refunded", "Failed", "1", "2", "3", "4", "5", "6", "7")
      ).optional(),
      note: Joi.string().optional().allow("", null),
      total: Joi.number().optional(),
      phone: Joi.string().optional().allow("", null),
      address: Joi.string().optional().allow("", null),
    });

    return schema.validate(data); // Returns { error, value }
  }
}

export default UpdateOrderRequest;

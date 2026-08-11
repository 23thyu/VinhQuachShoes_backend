import Joi from "joi";

class InsertCartItemRequest {
  constructor(data) {
    this.cart_id = data.cart_id;
    this.product_id = data.product_id;
    this.quantity = data.quantity;
  }

  static validate(data) {
    const schema = Joi.object({
      cart_id: Joi.number().integer().required(), // Cart ID must be a non-empty string
      product_id: Joi.number().integer().required(), // Product ID must be a non-empty string
      product_variant_id: Joi.number().integer().optional().allow(null),
      quantity: Joi.number().integer().min(0).required(), // Quantity must be a positive integer
    });

    return schema.validate(data); // Returns { error, value }
  }
}

export default InsertCartItemRequest;

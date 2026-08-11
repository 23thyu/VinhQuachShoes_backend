import Joi from "joi";

class InsertNewsRequest {
  constructor(data) {
    this.title = data.title;
    this.image = data.image; // Image is optional
    this.content = data.content;
    this.product_ids = data.product_ids; // Array of product IDs
  }

  static validate(data) {
    const schema = Joi.object({
      title: Joi.string().required(), // Title must be a non-empty string
      image: Joi.string().uri().allow("", null), // Image must be a valid URI, but it is optional
      content: Joi.string().required(), // Content must be a non-empty string
      product_ids: Joi.array().items(Joi.number().integer()).optional(), // Array of integers, optional
    });

    return schema.validate(data); // Returns { error, value }
  }
}

export default InsertNewsRequest;

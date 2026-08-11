import Joi from "joi";

class InsertProductVariantRequest {
  constructor(data) {
    this.product_id = data.product_id;
    this.attributes = data.attributes;
    this.price = data.price;
    this.quantity = data.quantity;
    this.attribute_images = data.attribute_images;
    this.image = data.image;
  }

  static validate(data) {
    const schema = Joi.object({
      product_id: Joi.number().integer().required(),
      attributes: Joi.object().required(),
      price: Joi.number().integer().min(0).optional().allow(null),
      quantity: Joi.number().integer().min(0).required(),
      attribute_images: Joi.object().optional().allow(null),
      image: Joi.string().optional().allow(null, ""),
    }).required();
    return schema.validate(data);
  }
}

export default InsertProductVariantRequest;

import Joi from "joi";

class UpdateProductRequest {
  constructor(data) {
    this.name = data.name;
    this.price = data.price;
    this.oldprice = data.oldprice;
    this.image = data.image;
    this.description = data.description;
    this.specification = data.specification;
    this.buyturn = data.buyturn;
    this.quantity = data.quantity;
    this.brand_id = data.brand_id;
    this.category_id = data.category_id;
    this.attributes = data.attributes;
  }

  static validate(data) {
    const schema = Joi.object({
      name: Joi.string().allow("").allow(null).optional(),
      price: Joi.number().min(0).allow(null).optional(),
      oldprice: Joi.number().allow(null).optional(),
      image: Joi.string().allow("").allow(null).optional(),
      description: Joi.string().allow("").allow(null).optional(),
      specification: Joi.string().allow("").allow(null).optional(),
      buyturn: Joi.number().integer().min(0).allow(null).optional(),
      quantity: Joi.number().integer().min(0).allow(null).optional(),
      brand_id: Joi.number().integer().allow(null).optional(),
      category_id: Joi.number().integer().allow(null).optional(),
      attributes: Joi.any().optional().allow(null),
    });

    return schema.validate(data, { abortEarly: false, allowUnknown: true });
  }
}

export default UpdateProductRequest;

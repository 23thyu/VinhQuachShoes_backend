import Joi from "joi";

class InsertProductRequests {
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
      name: Joi.string().required(),
      price: Joi.number().positive().required(),
      oldprice: Joi.number().allow(null).optional(),
      image: Joi.string().allow(""),
      description: Joi.string().allow("").allow(null).optional(),
      specification: Joi.string().allow("").allow(null).optional(),
      buyturn: Joi.number().integer().min(0),
      quantity: Joi.number().integer().min(0),
      brand_id: Joi.number().integer().required(),
      category_id: Joi.number().integer().required(),
      attributes: Joi.any().optional().allow(null),
    });
    return schema.validate(data, { allowUnknown: true });
  }
}
export default InsertProductRequests;

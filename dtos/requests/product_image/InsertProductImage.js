import Joi from "joi";

class InsertProductImageRequest {
  constructor(data) {
    this.product_id = data.product_id;
    this.image_url = data.image_url;
    this.image_urls = data.image_urls;
  }
  static validate(data) {
    const schema = Joi.object({
      product_id: Joi.number().integer().required(),
      image_url: Joi.string().optional().allow("").allow(null),
      image_urls: Joi.array().items(Joi.string()).optional(),
    });

    return schema.validate(data, { allowUnknown: true });
  }
}

export default InsertProductImageRequest;

import Joi from "joi";

class InsertBannerDetailRequest {
  constructor(data) {
    // Chỉ lấy các trường liên quan đến quan hệ banner-detail
    this.product_id = data.product_id;
    this.banner_id = data.banner_id;
  }

  static validate(data) {
    const schema = Joi.object({
      product_id: Joi.number().integer().required(), // product_id phải là số nguyên, bắt buộc
      banner_id: Joi.number().integer().required(), // banner_id phải là số nguyên, bắt buộc
    });

    return schema.validate(data); // Trả về { error, value }
  }
}

export default InsertBannerDetailRequest;

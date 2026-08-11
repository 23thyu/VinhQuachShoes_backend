import Joi from "joi";

class InsertNewsDetailRequest {
  constructor(data) {
    // Chỉ lấy các trường liên quan đến quan hệ news-detail
    this.product_id = data.product_id;
    this.news_id = data.news_id;
  }

  static validate(data) {
    const schema = Joi.object({
      product_id: Joi.number().integer().required(), // product_id phải là số nguyên, bắt buộc
      news_id: Joi.number().integer().required(), // news_id phải là số nguyên, bắt buộc
    });

    return schema.validate(data); // Trả về { error, value }
  }
}

export default InsertNewsDetailRequest;

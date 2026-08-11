import Joi from "joi";

class UpdateNewsRequest {
  constructor(data) {
    //modified
    this.title = data.title;
    this.image = data.image; // Image is optional
    this.content = data.content;
  }

  static validate(data) {
    const schema = Joi.object({
      title: Joi.string().optional().allow(null), // Title must be a non-empty string
      image: Joi.string().uri().allow("", null).optional(), // Image must be a valid URI, but it is optional
      content: Joi.string().optional().allow(null), // Content must be a non-empty string
      // Array of integers, optional
    });

    return schema.validate(data); // Returns { error, value }
  }
}

export default UpdateNewsRequest;

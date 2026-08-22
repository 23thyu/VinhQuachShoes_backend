import db from "../models/index.js";
import { uploadToCloudinary } from "../config/cloudinaryConfig.js";

// Fetch all feedbacks, ordered by created_at DESC
export async function getAllFeedbacks(req, res) {
  try {
    const feedbacks = await db.FeedBack.findAll({
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      message: "Lấy danh sách đánh giá thành công",
      data: feedbacks,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi máy chủ",
      error: error.message,
    });
  }
}

// Create feedback with content (optional) and image file upload to Cloudinary
export async function createFeedback(req, res) {
  try {
    const content = req.body.content ? String(req.body.content).trim() : "";
    let imageUrl = req.body.image_url || "";

    const file = req.file || (req.files && req.files.length > 0 ? req.files[0] : null);

    if (file) {
      const uploadResult = await uploadToCloudinary(file.buffer, "shopapp/feedbacks");
      imageUrl = uploadResult.secure_url;
    }

    if (!imageUrl) {
      return res.status(400).json({ error: "Hình ảnh feedback là bắt buộc." });
    }

    const feedback = await db.FeedBack.create({
      content: content,
      image_url: imageUrl,
    });

    return res.status(201).json({
      message: "Tạo đánh giá thành công",
      data: feedback,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Không thể tạo đánh giá",
      error: error.message,
    });
  }
}

// Delete feedback by ID (for admin use)
export async function deleteFeedback(req, res) {
  try {
    const { id } = req.params;
    const feedback = await db.FeedBack.findByPk(id);

    if (!feedback) {
      return res.status(404).json({
        message: "Đánh giá không tồn tại",
      });
    }

    await feedback.destroy();

    return res.status(200).json({
      message: "Xóa đánh giá thành công",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Không thể xóa đánh giá",
      error: error.message,
    });
  }
}

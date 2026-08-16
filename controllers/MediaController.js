import db from "../models/index.js";
import { Sequelize } from "sequelize";
const { Op } = Sequelize;
import { uploadToCloudinary } from "../config/cloudinaryConfig.js";
import cloudinary from "../config/cloudinaryConfig.js";

export async function uploadMedia(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Không có file nào được tải lên." });
    }

    if (req.files.length > 25) {
      return res.status(400).json({ error: "Chỉ cho phép tải lên tối đa 25 ảnh một lần." });
    }

    // Upload tất cả các file lên Cloudinary
    const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer, "shopapp"));
    const uploadResults = await Promise.all(uploadPromises);

    // Lưu thông tin vào bảng Media
    const mediaRecords = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const result = uploadResults[i];

      const record = await db.Media.create({
        name: file.originalname,
        url: result.secure_url,
        public_id: result.public_id,
      });
      mediaRecords.push(record);
    }

    return res.status(201).json({
      message: "Tải ảnh lên thư viện thành công.",
      data: mediaRecords,
    });
  } catch (error) {
    console.error("Lỗi trong uploadMedia:", error);
    return res.status(500).json({
      message: "Lỗi hệ thống khi tải ảnh lên thư viện",
      error: error.message,
    });
  }
}

export async function getAllMedia(req, res) {
  try {
    const { search = "", page = 1, limit } = req.query;

    let whereClause = {};
    if (search.trim() !== "") {
      whereClause = {
        name: { [Op.like]: `%${search}%` },
      };
    }

    const queryOptions = {
      where: whereClause,
      order: [["created_at", "DESC"]],
    };

    let pageNum = 1;
    let limitNum = 12;

    if (limit !== "all") {
      pageNum = parseInt(page, 10) || 1;
      limitNum = parseInt(limit, 10) || 12;
      const offset = (pageNum - 1) * limitNum;
      queryOptions.limit = limitNum;
      queryOptions.offset = offset;
    }

    const [media, totalMedia] = await Promise.all([
      db.Media.findAll(queryOptions),
      db.Media.count({ where: whereClause }),
    ]);

    return res.status(200).json({
      message: "Lấy danh sách thư viện ảnh thành công",
      data: media,
      current_page: limit !== "all" ? pageNum : 1,
      total_page: limit !== "all" ? Math.ceil(totalMedia / limitNum) : 1,
      total: totalMedia,
    });
  } catch (error) {
    console.error("Lỗi trong getAllMedia:", error);
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách thư viện ảnh",
      error: error.message,
    });
  }
}

export async function deleteMedia(req, res) {
  try {
    const { id } = req.params;

    const media = await db.Media.findByPk(id);
    if (!media) {
      return res.status(404).json({
        message: "Không tìm thấy ảnh trong thư viện",
      });
    }

    // Xóa file trên Cloudinary nếu có public_id
    if (media.public_id) {
      await cloudinary.uploader.destroy(media.public_id);
    }

    // Xóa record trong DB
    await media.destroy();

    return res.status(200).json({
      message: "Xóa ảnh khỏi thư viện thành công",
    });
  } catch (error) {
    console.error("Lỗi trong deleteMedia:", error);
    return res.status(500).json({
      message: "Lỗi khi xóa ảnh khỏi thư viện",
      error: error.message,
    });
  }
}

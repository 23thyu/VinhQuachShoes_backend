import db from "../models";
import { Sequelize } from "sequelize";
import { GetImageURL } from "../helpers/imageHelper.js";

const { Op } = Sequelize;
export const getBannerDetails = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    const [bannerDetails, total] = await Promise.all([
      db.BannerDetail.findAll({
        include: [
          { model: db.Banner, as: "banner" },
          { model: db.Product, as: "product" },
        ],
        limit: pageSize,
        offset,
      }),
      db.BannerDetail.count(),
    ]);
    res.status(200).json({
      message: "Lấy danh sách chi tiết banner thành công",
      data: bannerDetails,
      current_page: parseInt(page, 10),
      total_page: Math.ceil(total / pageSize),
      total,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách chi tiết banner",
      error: error.message,
    });
  }
};

export const getBannerDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const bannerDetail = await db.BannerDetail.findByPk(id, {
      include: [
        { model: db.Banner, as: "banner" },
        { model: db.Product, as: "product" },
      ],
    });
    if (!bannerDetail) {
      return res.status(404).json({
        message: "Chi tiết banner không tìm thấy",
      });
    }
    res.status(200).json({
      message: "Lấy thông tin chi tiết banner thành công",
      data: bannerDetail,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy chi tiết banner",
      error: error.message,
    });
  }
};
export const insertBannerDetail = async (req, res) => {
  const { product_id, banner_id } = req.body;

  // Check if product_id exists in db.Product
  const productExists = await db.Product.findByPk(product_id);
  if (!productExists) {
    return res.status(404).json({
      message: "Sản phẩm không tồn tại",
    });
  }

  // Check if banner_id exists in db.Banner
  const bannerExists = await db.Banner.findByPk(banner_id);
  if (!bannerExists) {
    return res.status(404).json({
      message: "Banner không tồn tại",
    });
  }

  // Check for duplicate product_id and banner_id in db.BannerDetail
  const duplicateExists = await db.BannerDetail.findOne({
    where: { product_id, banner_id },
  });
  if (duplicateExists) {
    return res.status(409).json({
      message: "Chi tiết banner này đã tồn tại",
    });
  }

  // If validations pass, create the new BannerDetail
  const newBannerDetail = await db.BannerDetail.create({
    product_id,
    banner_id,
  });
  res.status(201).json({
    message: "Thêm mới chi tiết banner thành công",
    data: newBannerDetail,
  });
};
export const deleteBannerDetail = async (req, res) => {
  const { id } = req.params;
  const deleted = await db.BannerDetail.destroy({ where: { id } });
  if (deleted) {
    res.status(200).json({
      message: "Xóa chi tiết banner thành công",
    });
  } else {
    res.status(404).json({
      message: "Chi tiết banner không tìm thấy",
    });
  }
};

export const updateBannerDetail = async (req, res) => {
  const { id } = req.params;
  const { product_id, banner_id } = req.body;

  // Check if there's another record with the same product_id and banner_id
  const existingBannerDetail = await db.BannerDetail.findOne({
    where: {
      product_id,
      banner_id,
      id: { [db.Sequelize.Op.ne]: id }, // Exclude the current record
    },
  });

  if (existingBannerDetail) {
    return res.status(409).json({
      message: "Đã tồn tại một chi tiết banner với sản phẩm và banner này!",
    });
  }

  // Proceed with the update if no duplicates found
  const [updated] = await db.BannerDetail.update(
    { product_id, banner_id },
    { where: { id } }
  );

  if (updated) {
    res.status(200).json({
      message: "Cập nhật chi tiết banner thành công",
    });
  } else {
    res.status(404).json({
      message: "Chi tiết banner không tìm thấy hoặc không có gì để cập nhật!",
    });
  }
};

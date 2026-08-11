import db from "../models/index.js";
import { Sequelize } from "sequelize";
const { Op } = Sequelize;
import path from "path";
import fs from "fs";
import BannerStatus from "../constants/BannerStatus.js";
import { GetImageURL } from "../helpers/imageHelper.js";

export async function getBanners(req, res) {
  try {
    const { search = "", page = 1, limit } = req.query;
    const pageSize = 5;
    const offset = (page - 1) * pageSize;

    let whereClause = {};
    if (search.trim() !== "") {
      whereClause = {
        [Op.or]: [{ name: { [Op.like]: `%${search}%` } }],
      };
    }

    const queryOptions = {
      attributes: ["id", "name", "image", "status"],
      where: whereClause,
    };
    if (limit !== "all") {
      queryOptions.limit = pageSize;
      queryOptions.offset = offset;
    }

    const [banners, totalBanners] = await Promise.all([
      db.Banner.findAll(queryOptions),
      db.Banner.count({
        where: whereClause,
      }),
    ]);

    res.status(200).json({
      message: "Lấy danh sách banner thành công",
      data: banners.map((banner) => ({
        ...banner.get({ plain: true }),
        image: GetImageURL(banner.image),
      })),
      current_page: parseInt(page, 10),
      total_page: Math.ceil(totalBanners / pageSize),
      total: totalBanners,
    });
  } catch (error) {
    console.error("Error in getBanners:", error);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách banner",
      error: error.message,
    });
  }
} // Lấy banner theo ID
export async function getBannerById(req, res) {
  try {
    const { id } = req.params;
    const banner = await db.Banner.findByPk(id, {
      attributes: ["id", "name", "image", "status"],
    });

    if (!banner) {
      return res.status(404).json({
        message: "Không tìm thấy banner",
      });
    }

    res.status(200).json({
      message: "Lấy thông tin banner thành công",
      data: {
        ...banner.get({ plain: true }),
        image: GetImageURL(banner.image),
      },
    });
  } catch (error) {
    console.error("Error in getBannerById:", error);
    res.status(500).json({
      message: "Lỗi khi lấy thông tin banner",
      error: error.message,
    });
  }
}

export async function insertBanner(req, res) {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Tên banner không được để trống",
      });
    }

    // Kiểm tra banner đã tồn tại chưa
    const existingBanner = await db.Banner.findOne({
      where: {
        name: name.trim(),
      },
    });

    if (existingBanner) {
      return res.status(409).json({
        message: "Banner đã tồn tại",
      });
    }
    const bannerStatus = { ...req.body, status: BannerStatus.ACTIVE };
    const banner = await db.Banner.create(bannerStatus);

    res.status(201).json({
      message: "Tạo banner thành công",
      data: {
        ...banner.get({ plain: true }),
        image: GetImageURL(banner.image),
      },
    });
  } catch (error) {
    console.error("Error in insertBanner:", error);
    res.status(500).json({
      message: "Lỗi khi tạo banner",
      error: error.message,
    });
  }
}
export async function deleteBanner(req, res) {
  try {
    const { id } = req.params;
    const deletedBanner = await db.Banner.destroy({
      where: { id },
    });

    if (deletedBanner) {
      return res.status(200).json({ message: "Xóa banner thành công" });
    } else {
      return res.status(404).json({
        message: "Không tìm thấy banner để xóa",
      });
    }
  } catch (error) {
    console.error("Error in deleteBanner:", error);
    res.status(500).json({
      message: "Lỗi khi xóa banner",
      error: error.message,
    });
  }
}
export async function updateBanner(req, res) {
  try {
    const { id } = req.params;

    // Kiểm tra banner có tồn tại không
    const banner = await db.Banner.findByPk(id);
    if (!banner) {
      return res.status(404).json({
        message: "Không tìm thấy banner để cập nhật",
      });
    }

    // Kiểm tra tên banner đã tồn tại ngoại trừ bản thân nó nếu có tên mới trong request
    if (req.body.name) {
      const existingBanner = await db.Banner.findOne({
        where: {
          name: req.body.name.trim(),
          id: { [Sequelize.Op.ne]: id },
        },
      });

      if (existingBanner) {
        return res.status(409).json({
          message: "Tên banner đã tồn tại",
        });
      }
    }

    await db.Banner.update(req.body, {
      where: { id },
    });

    return res.status(200).json({ message: "Cập nhật banner thành công" });
  } catch (error) {
    console.error("Error in updateBanner:", error);
    res.status(500).json({
      message: "Lỗi khi cập nhật banner",
      error: error.message,
    });
  }
}

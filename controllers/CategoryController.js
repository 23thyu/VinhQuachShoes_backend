import { Op } from "sequelize";
import db from "../models";
import { GetImageURL } from "../helpers/imageHelper.js";
export async function getCategories(req, res) {
  try {
    const { search = "", page = 1, limit } = req.query;
    const pageSize = 5;
    const offset = (page - 1) * pageSize;

    let whereClause = {};
    if (search.trim() !== "") {
      whereClause = {
        name: {
          [Op.like]: `%${search}%`,
        },
      };
    }

    const queryOptions = {
      where: whereClause,
    };
    if (limit !== "all") {
      queryOptions.limit = pageSize;
      queryOptions.offset = offset;
    }

    const [categories, totalCategories] = await Promise.all([
      db.Category.findAll(queryOptions),
      db.Category.count({
        where: whereClause,
      }),
    ]);

    res.status(200).json({
      message: "Lấy danh sách danh mục thành công",
      data: categories.map((category) => ({
        ...category.get({ plain: true }),
        image: GetImageURL(category.image),
      })),
      current_page: parseInt(page, 10),
      total_page: Math.ceil(totalCategories / pageSize),
      total: totalCategories,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

export async function getCategoryById(req, res) {
  try {
    const { id } = req.params;
    const category = await db.Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        message: "Danh mục không tìm thấy",
      });
    }
    res.status(200).json({
      message: "Lấy danh mục thành công",
      data: {
        ...category.get({ plain: true }),
        image: GetImageURL(category.image),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh mục",
      error: error.message,
    });
  }
}

export async function insertCategory(req, res) {
  try {
    const category = await db.Category.create(req.body);
    res.status(201).json({
      message: "Thêm một danh mục mới thành công",
      data: {
        ...category.get({ plain: true }),
        image: GetImageURL(category.image),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi thêm danh mục",
      error: error.message,
    });
  }
}

export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const deleted = await db.Category.destroy({
      where: { id },
    });
    if (deleted) {
      return res.status(200).json({
        message: "Xóa danh mục thành công",
      });
    } else {
      return res.status(404).json({
        message: "Danh mục không tìm thấy",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi xóa danh mục",
      error: error.message,
    });
  }
}

export async function updateCategory(req, res) {
  const { id } = req.params;
  const { name } = req.body;

  // Check for another category with the same name and a different ID
  const existingCategory = await db.Category.findOne({
    where: {
      name: name,
      id: { [db.Sequelize.Op.ne]: id }, // Exclude the current category from the check
    },
  });

  if (existingCategory) {
    // If a duplicate is found, return an error response
    return res.status(400).json({
      message: "Tên danh mục đã tồn tại, vui lòng chọn tên khác.",
    });
  }

  const updatedCategory = await db.Category.update(req.body, {
    where: { id },
  });

  if (updatedCategory[0] > 0) {
    return res.status(200).json({
      message: "Cập nhật danh mục thành công",
    });
  } else {
    return res.status(404).json({
      message: "Danh mục không tìm thấy",
    });
  }
}

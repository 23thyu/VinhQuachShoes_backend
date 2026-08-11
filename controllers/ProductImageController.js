import db from "../models";
import { Sequelize } from "sequelize"; import { GetImageURL } from "../helpers/imageHelper.js";
const { Op } = Sequelize;
export const getProductImages = async (req, res) => {
  const { product_id } = req.query;
  const page = parseInt(req.query.page) || 1;
  const pageSize = 5;
  const offset = (page - 1) * pageSize;

  let whereClause = {};
  if (product_id) {
    whereClause.product_id = product_id;
  }

  try {
    const [productImages, totalProductImages] = await Promise.all([
      db.ProductImage.findAll({
        where: whereClause,
        limit: pageSize,
        offset: offset,
        // Không include product để tránh response thừa — client đã có context
      }),
      db.ProductImage.count({
        where: whereClause,
      }),
    ]);

    return res.status(200).json({
      message: "Lấy danh sách ảnh sản phẩm thành công",
      data: productImages.map((img) => ({
        ...img.get({ plain: true }),
        image_url: GetImageURL(img.image_url),
      })),
      current_page: page,
      total_page: Math.ceil(totalProductImages / pageSize),
      total: totalProductImages,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi truy vấn ảnh sản phẩm",
      error: error.message,
    });
  }
};

export async function getProductImage(req, res) {
  try {
    const { id } = req.params;
    const productImage = await db.ProductImage.findByPk(id);

    if (!productImage) {
      return res.status(404).json({
        message: "Ảnh sản phẩm không tìm thấy",
      });
    }
    res.status(200).json({
      message: "Lấy thông tin ảnh sản phẩm thành công",
      data: {
        ...productImage.get({ plain: true }),
        image_url: GetImageURL(productImage.image_url),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi lấy thông tin ảnh sản phẩm",
      error: error.message,
    });
  }
}

export async function insertProductImage(req, res) {
  const { product_id, image_url } = req.body;

  // Kiểm tra xem sản phẩm có tồn tại không
  const product = await db.Product.findByPk(product_id);
  if (!product) {
    return res.status(404).json({
      message: "Sản phẩm không tồn tại",
    });
  }

  // Kiểm tra xem cặp product_id và image_url đã tồn tại trong bảng ProductImage chưa
  const existingImage = await db.ProductImage.findOne({
    where: {
      product_id: product_id,
      image_url: image_url,
    },
  });

  if (existingImage) {
    return res.status(409).json({
      message: "Ảnh này đã được liên kết với sản phẩm này.",
    });
  }

  // Nếu mọi thứ hợp lệ, tiến hành thêm mới ảnh sản phẩm
  try {
    const newProductImage = await db.ProductImage.create({
      product_id: product_id,
      image_url: image_url,
    });

    res.status(201).json({
      message: "Thêm mới ảnh sản phẩm thành công",
      data: newProductImage,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi thêm mới ảnh sản phẩm",
      error: error.message,
    });
  }
}
export const deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.ProductImage.destroy({
      where: { id },
    });

    if (deleted) {
      return res.status(200).json({
        message: "Xoá ảnh sản phẩm thành công",
      });
    } else {
      return res.status(404).json({
        message: "Ảnh sản phẩm không tìm thấy",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi xoá ảnh sản phẩm",
      error: error.message,
    });
  }
};


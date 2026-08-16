import db from "../models";
import { Sequelize } from "sequelize"; import { GetImageURL } from "../helpers/imageHelper.js";
const { Op } = Sequelize;
export const getProductImages = async (req, res) => {
  const { product_id } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limitParam = req.query.limit;
  const pageSize = limitParam === "all" ? null : (parseInt(limitParam, 10) || 25);
  const offset = pageSize ? (page - 1) * pageSize : undefined;

  let whereClause = {};
  if (product_id) {
    whereClause.product_id = product_id;
  }

  try {
    const [productImages, totalProductImages] = await Promise.all([
      db.ProductImage.findAll({
        where: whereClause,
        ...(pageSize ? { limit: pageSize, offset: offset } : {}),
        order: [["id", "ASC"]],
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
      total_page: pageSize ? Math.ceil(totalProductImages / pageSize) : 1,
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
  const { product_id, image_url, image_urls } = req.body;

  // Kiểm tra xem sản phẩm có tồn tại không
  const product = await db.Product.findByPk(product_id);
  if (!product) {
    return res.status(404).json({
      message: "Sản phẩm không tồn tại",
    });
  }

  const urlsToAdd = Array.isArray(image_urls) ? image_urls : (image_url ? [image_url] : []);
  if (urlsToAdd.length === 0) {
    return res.status(400).json({
      message: "Vui lòng cung cấp URL hình ảnh",
    });
  }

  // Kiểm tra giới hạn 25 ảnh phụ
  const currentCount = await db.ProductImage.count({
    where: { product_id: product_id },
  });

  if (currentCount + urlsToAdd.length > 25) {
    return res.status(400).json({
      message: `Tối đa chỉ được chọn 25 hình ảnh phụ cho một sản phẩm. Hiện tại đã có ${currentCount} ảnh.`,
    });
  }

  try {
    const createdImages = [];
    for (const url of urlsToAdd) {
      const existingImage = await db.ProductImage.findOne({
        where: {
          product_id: product_id,
          image_url: url,
        },
      });

      if (!existingImage) {
        const newProductImage = await db.ProductImage.create({
          product_id: product_id,
          image_url: url,
        });
        createdImages.push(newProductImage);
      }
    }

    res.status(201).json({
      message: `Thêm mới ${createdImages.length} ảnh sản phẩm thành công`,
      data: createdImages,
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


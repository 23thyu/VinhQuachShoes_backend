import { Model, Sequelize, where } from "sequelize";
import db from "../models";
import { GetImageURL } from "../helpers/imageHelper.js";
import InsertProductRequests from "../dtos/requests/product/InsertProductRequests";
const { Op } = Sequelize;
export async function getProducts(req, res) {
  const { search = "", page = 1, category_id, brand_id, sort = "newest", limit } = req.query;
  
  let pageSize = 6;
  let offset = (page - 1) * pageSize;
  let isPaginated = true;

  if (limit === "all") {
    isPaginated = false;
  } else if (limit) {
    pageSize = parseInt(limit, 10) || 6;
    offset = (page - 1) * pageSize;
  }

  let whereClause = {};
  if (search.trim() !== "") {
    whereClause = {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { specification: { [Op.like]: `%${search}%` } },
      ],
    };
  }
  if (category_id) whereClause.category_id = category_id;
  if (brand_id) whereClause.brand_id = brand_id;

  const sortOrders = {
    newest:     [["created_at", "DESC"]],
    oldest:     [["created_at", "ASC"]],
    price_asc:  [["price", "ASC"]],
    price_desc: [["price", "DESC"]],
    popular:    [["buyturn", "DESC"]],
  };
  const orderClause = sortOrders[sort] || sortOrders.newest;
  try {
    const [products, totalProducts] = await Promise.all([
      db.Product.findAll({
        where: whereClause,
        ...(isPaginated ? { limit: pageSize, offset: offset } : {}),
        order: orderClause,
        include: [
          { model: db.Brand, as: "brand", attributes: ["id", "name", "image"] },
          { model: db.Category, as: "category", attributes: ["id", "name", "image"] },
        ],
      }),
      db.Product.count({ where: whereClause }),
    ]);

    const formattedProducts = products.map((p) => {
      const plain = p.get({ plain: true });
      plain.image = GetImageURL(plain.image);
      if (plain.brand) {
        plain.brand.image = GetImageURL(plain.brand.image);
      }
      if (plain.category) {
        plain.category.image = GetImageURL(plain.category.image);
      }
      return plain;
    });

    res.status(200).json({
      message: "lấy danh sách sản phẩm thành công",
      data: formattedProducts,
      current_page: isPaginated ? parseInt(page, 10) : 1,
      total_page: isPaginated ? Math.ceil(totalProducts / pageSize) : 1,
      total: totalProducts,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách sản phẩm",
      error: error.message,
    });
  }
}
export async function getProductsById(req, res) {
  try {
    const { id } = req.params;
    const product = await db.Product.findByPk(id, {
      include: [
        { model: db.ProductImage, as: "product_images" },
        {
          model: db.ProductVariant,
          as: "variants",
          include: [{ model: db.ProductVariantDetail, as: "details" }],
        },
        { model: db.Brand, as: "brand", attributes: ["id", "name", "image"] },
        { model: db.Category, as: "category", attributes: ["id", "name", "image"] },
      ],
    });
    if (!product) {
      return res.status(404).json({
        message: "Sản phẩm không tìm thấy",
      });
    }

    const productData = product.get({ plain: true });
    productData.image = GetImageURL(productData.image);
    if (productData.brand) {
      productData.brand.image = GetImageURL(productData.brand.image);
    }
    if (productData.category) {
      productData.category.image = GetImageURL(productData.category.image);
    }
    if (productData.product_images) {
      productData.product_images = productData.product_images.map((img) => ({
        ...img,
        image_url: GetImageURL(img.image_url),
      }));
    }
    if (productData.variants) {
      productData.variants = productData.variants.map((v) => {
        if (v.image) {
          v.image = GetImageURL(v.image);
        }
        if (v.details) {
          v.details = v.details.map((d) => ({
            ...d,
            image: GetImageURL(d.image),
          }));
        }
        return v;
      });
    }

    res.status(200).json({ message: "Lấy thông tin sản phẩm thành công", data: productData });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy thông tin sản phẩm",
      error: error.message,
    });
  }
}

export async function insertProducts(req, res) {
  try {
    const userId = req.body.user_id || req.user?.id;
    const user = await db.User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        message: "Người dùng không tồn tại",
      });
    }
    const product = await db.Product.create(req.body);
    return res.status(201).json({
      message: "Thêm sản phẩm thành công",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi thêm sản phẩm",
      error: error.message,
    });
  }
}
export async function updateProducts(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;

    const product = await db.Product.findByPk(id);
    if (!product) {
      return res.status(404).json({
        message: "Sản phẩm không tìm thấy",
      });
    }

    if (name !== undefined && name !== null) {
      const existingProduct = await db.Product.findOne({
        where: {
          name: name,
          id: { [db.Sequelize.Op.ne]: id },
        },
      });
      if (existingProduct) {
        return res.status(400).json({
          message: "Tên sản phẩm đã tồn tại, vui lòng chọn tên khác.",
        });
      }
    }

    await db.Product.update(req.body, { where: { id } });
    return res.status(200).json({
      message: "Cập nhật sản phẩm thành công",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi cập nhật sản phẩm",
      error: error.message,
    });
  }
}

export async function deleteProducts(req, res) {
  const { id } = req.params;
  const transaction = await db.sequelize.transaction();
  try {
    // 1. Kiểm tra xem sản phẩm có trong đơn hàng nào không
    const orderedCount = await db.OrderDetail.count({
      where: { product_id: id },
      transaction,
    });

    if (orderedCount > 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Sản phẩm này đã phát sinh đơn hàng, không thể xóa để bảo toàn lịch sử giao dịch. Bạn có thể ẩn sản phẩm hoặc đặt số lượng về 0.",
      });
    }

    // 2. Xóa các liên kết phụ
    await db.CartItem.destroy({ where: { product_id: id }, transaction });
    await db.FeedBack.destroy({ where: { product_id: id }, transaction });
    await db.BannerDetail.destroy({ where: { product_id: id }, transaction });
    await db.NewsDetails.destroy({ where: { product_id: id }, transaction });

    // 3. Xóa sản phẩm (các bảng product_variants, product_images, product_variants_details có onDelete: CASCADE sẽ tự động xóa)
    const deletedCount = await db.Product.destroy({
      where: { id },
      transaction,
    });

    if (deletedCount > 0) {
      await transaction.commit();
      return res.status(200).json({
        message: "Xóa sản phẩm thành công",
      });
    } else {
      await transaction.rollback();
      return res.status(404).json({
        message: "Sản phẩm không tìm thấy",
      });
    }
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: "Lỗi khi xóa sản phẩm",
      error: error.message,
    });
  }
}


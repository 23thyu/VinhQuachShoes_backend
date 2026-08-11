import db from "../models";
import { GetImageURL } from "../helpers/imageHelper.js";
import { Sequelize } from "sequelize";
const { Op } = Sequelize;

const formatCartItem = (item) => {
  if (!item) return null;
  const plain = item.get({ plain: true });
  if (plain.product) {
    plain.product.image = GetImageURL(plain.product.image);
  }
  if (plain.product_variant) {
    if (plain.product_variant.details) {
      plain.product_variant.details = plain.product_variant.details.map((d) => ({
        ...d,
        image: GetImageURL(d.image),
      }));
    }
  }
  return plain;
};

export const getCartItems = async (req, res) => {
  const { cart_id, page = 1 } = req.query;
  const pageSize = 5;
  const offset = (page - 1) * pageSize;

  let whereClause = {};
  if (cart_id) {
    whereClause.cart_id = cart_id;
  }

  try {
    const [cartItems, totalCartItems] = await Promise.all([
      db.CartItem.findAll({
        where: whereClause,
        include: [
          {
            model: db.Product,
            as: "product",
          },
          {
            model: db.ProductVariant,
            as: "product_variant",
            include: [{ model: db.ProductVariantDetail, as: "details" }],
          },
        ],
        limit: pageSize,
        offset: offset,
      }),
      db.CartItem.count({
        where: whereClause,
      }),
    ]);

    return res.status(200).json({
      message: "Lấy danh sách mục trong giỏ hàng thành công",
      data: cartItems.map(formatCartItem),
      current_page: parseInt(page, 10),
      total_page: Math.ceil(totalCartItems / pageSize),
      total: totalCartItems,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách mục trong giỏ hàng",
      error: error.message,
    });
  }
};
export const getCartItemByCartId = async (req, res) => {
  const { cart_id } = req.params;
  const cartItems = await db.CartItem.findAll({
    where: { cart_id },
    include: [
      {
        model: db.Product,
        as: "product",
      },
      {
        model: db.ProductVariant,
        as: "product_variant",
        include: [{ model: db.ProductVariantDetail, as: "details" }],
      },
    ],
  });

  res.status(200).json({
    message: "Lấy thông tin mục trong giỏ hàng thành công",
    data: cartItems.map(formatCartItem),
  });
};
export const insertCartItem = async (req, res) => {
  const { product_id, product_variant_id, quantity, cart_id } = req.body;

  let maxQuantityAvailable = 0;
  if (product_variant_id) {
    const variantExists = await db.ProductVariant.findByPk(product_variant_id);
    if (!variantExists) {
      return res.status(404).json({
        message: "Biến thể sản phẩm không tồn tại",
      });
    }
    if (variantExists.product_id !== product_id) {
      return res.status(400).json({
        message: "Biến thể không thuộc về sản phẩm này",
      });
    }
    maxQuantityAvailable = variantExists.quantity;
  } else {
    const productExists = await db.Product.findByPk(product_id);
    if (!productExists) {
      return res.status(404).json({
        message: "Sản phẩm không tồn tại",
      });
    }
    maxQuantityAvailable = productExists.quantity;
  }

  if (maxQuantityAvailable < quantity) {
    return res.status(400).json({
      message: `Số lượng sản phẩm trong kho không đủ (Hiện có ${maxQuantityAvailable})`,
    });
  }

  const cartExists = await db.Cart.findByPk(cart_id);
  if (!cartExists) {
    return res.status(404).json({
      message: "Giỏ hàng không tồn tại",
    });
  }

  // Tìm kiếm mục giỏ hàng trùng khớp product_id và product_variant_id
  const existingCartItem = await db.CartItem.findOne({
    where: {
      product_id,
      cart_id,
      product_variant_id: product_variant_id || null,
    },
  });

  if (existingCartItem) {
    if (quantity === 0) {
      await existingCartItem.destroy();
      return res.status(200).json({
        message: "Xóa mục trong giỏ hàng thành công",
      });
    } else {
      const newQuantity = existingCartItem.quantity + quantity;
      if (maxQuantityAvailable < newQuantity) {
        return res.status(400).json({
          message: `Số lượng sản phẩm trong kho không đủ (Hiện có ${maxQuantityAvailable}, trong giỏ hàng đã có ${existingCartItem.quantity})`,
        });
      }
      existingCartItem.quantity = newQuantity;
      await existingCartItem.save();
      const updatedItem = await db.CartItem.findByPk(existingCartItem.id, {
        include: [
          { model: db.Product, as: "product" },
          {
            model: db.ProductVariant,
            as: "product_variant",
            include: [{ model: db.ProductVariantDetail, as: "details" }],
          },
        ],
      });
      return res.status(200).json({
        message: "Cập nhật mục trong giỏ hàng thành công",
        data: formatCartItem(updatedItem),
      });
    }
  } else {
    if (quantity > 0) {
      const newCartItem = await db.CartItem.create({
        cart_id,
        product_id,
        product_variant_id: product_variant_id || null,
        quantity,
      });
      const createdItem = await db.CartItem.findByPk(newCartItem.id, {
        include: [
          { model: db.Product, as: "product" },
          {
            model: db.ProductVariant,
            as: "product_variant",
            include: [{ model: db.ProductVariantDetail, as: "details" }],
          },
        ],
      });
      return res.status(201).json({
        message: "Thêm mới mục trong giỏ hàng thành công",
        data: formatCartItem(createdItem),
      });
    } else {
      return res.status(400).json({
        message: "Số lượng phải lớn hơn 0",
      });
    }
  }
};
export const updateCartItem = async (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  try {
    const cartItem = await db.CartItem.findByPk(id);
    if (!cartItem) {
      return res.status(404).json({
        message: "Mục trong giỏ hàng không tìm thấy",
      });
    }

    if (quantity !== undefined) {
      if (quantity < 0) {
        return res.status(400).json({
          message: "Số lượng phải lớn hơn hoặc bằng 0",
        });
      }
      if (quantity === 0) {
        await cartItem.destroy();
        return res.status(200).json({
          message: "Xóa mục trong giỏ hàng thành công",
        });
      }

      // Check stock
      let maxQuantityAvailable = 0;
      if (cartItem.product_variant_id) {
        const variant = await db.ProductVariant.findByPk(cartItem.product_variant_id);
        if (!variant) {
          return res.status(404).json({
            message: "Biến thể sản phẩm không tồn tại",
          });
        }
        maxQuantityAvailable = variant.quantity;
      } else {
        const product = await db.Product.findByPk(cartItem.product_id);
        if (!product) {
          return res.status(404).json({
            message: "Sản phẩm không tồn tại",
          });
        }
        maxQuantityAvailable = product.quantity;
      }

      if (maxQuantityAvailable < quantity) {
        return res.status(400).json({
          message: `Số lượng sản phẩm trong kho không đủ (Hiện có ${maxQuantityAvailable})`,
        });
      }
    }

    await db.CartItem.update(req.body, {
      where: { id },
    });

    const updatedCartItem = await db.CartItem.findByPk(id, {
      include: [
        { model: db.Product, as: "product" },
        {
          model: db.ProductVariant,
          as: "product_variant",
          include: [{ model: db.ProductVariantDetail, as: "details" }],
        },
      ],
    });
    return res.status(200).json({
      message: "Cập nhật mục trong giỏ hàng thành công",
      data: formatCartItem(updatedCartItem),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi cập nhật mục trong giỏ hàng",
      error: error.message,
    });
  }
};
export const deleteCartItem = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await db.CartItem.destroy({
      where: { id },
    });

    if (deleted) {
      return res.status(200).json({
        message: "Xóa mục trong giỏ hàng thành công",
      });
    } else {
      return res.status(404).json({
        message: "Mục trong giỏ hàng không tìm thấy",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi xóa mục trong giỏ hàng",
      error: error.message,
    });
  }
};

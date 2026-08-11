import db from "../models";
import { GetImageURL } from "../helpers/imageHelper.js";
import { Sequelize } from "sequelize";
import OrderStatus from "../constants/OrderStatus.js";
const { Op } = Sequelize;


export const getCarts = async (req, res) => {
  const { session_id, user_id, page = 1 } = req.query;
  const pageSize = 5;
  const offset = (page - 1) * pageSize;

  let whereClause = {};
  if (session_id) whereClause.session_id = session_id;
  if (user_id) whereClause.user_id = user_id;

  try {
    const [carts, totalCarts] = await Promise.all([
      db.Cart.findAll({
        where: whereClause,
        include: [
          {
            model: db.CartItem,
            as: "cart_items",
            include: [
              { model: db.Product, as: "product" },
              {
                model: db.ProductVariant,
                as: "product_variant",
                include: [{ model: db.ProductVariantDetail, as: "details" }],
              },
            ],
          },
        ],
        limit: pageSize,
        offset: offset,
      }),
      db.Cart.count({
        where: whereClause,
      }),
    ]);

    // Format carts
    const formattedCarts = carts.map(cart => {
      const plainCart = cart.get({ plain: true });
      if (plainCart.cart_items) {
        plainCart.cart_items = plainCart.cart_items.map(item => {
          if (item.product) {
            item.product.image = GetImageURL(item.product.image);
          }
          if (item.product_variant) {
            if (item.product_variant.details) {
              item.product_variant.details = item.product_variant.details.map(d => ({
                ...d,
                image: GetImageURL(d.image)
              }));
            }
          }
          return item;
        });
      }
      return plainCart;
    });

    return res.status(200).json({
      message: "Lấy danh sách giỏ hàng thành công",
      data: formattedCarts,
      current_page: parseInt(page, 10),
      total_page: Math.ceil(totalCarts / pageSize),
      total: totalCarts,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách giỏ hàng",
      error: error.message,
    });
  }
};
export const getCartById = async (req, res) => {
  const { id } = req.params;
  try {
    const cart = await db.Cart.findByPk(id, {
      include: [
        {
          model: db.CartItem,
          as: "cart_items",
        },
      ],
    });

    if (!cart) {
      return res.status(404).json({
        message: "Giỏ hàng không tìm thấy",
      });
    }
    res.status(200).json({
      message: "Lấy thông tin giỏ hàng thành công",
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi lấy thông tin giỏ hàng",
      error: error.message,
    });
  }
};
export const insertCart = async (req, res) => {
  try {
    const { session_id, user_id } = req.body;

    // Phải có ít nhất một trong hai: session_id hoặc user_id
    if (!session_id && !user_id) {
      return res.status(400).json({
        message: "Cần cung cấp ít nhất session_id hoặc user_id",
      });
    }

    // Kiểm tra giỏ hàng đã tồn tại
    let whereClause = {};
    if (session_id) {
      whereClause.session_id = session_id;
    }
    if (user_id) {
      whereClause.user_id = user_id;
    }

    const existingCart = await db.Cart.findOne({
      where: whereClause,
    });

    if (existingCart) {
      return res.status(409).json({
        message: "Giỏ hàng đã tồn tại cho session/user này",
        data: existingCart,
      });
    }

    const cart = await db.Cart.create(req.body);

    res.status(201).json({
      message: "Thêm mới giỏ hàng thành công",
      data: cart,
    });
  } catch (error) {
    console.error("Error in insertCart:", error);
    return res.status(500).json({
      message: "Lỗi khi thêm giỏ hàng",
      error: error.message,
    });
  }
};
export const checkoutCart = async (req, res) => {
  const { cart_id, total, note, phone, address } = req.body;
  const transaction = await db.sequelize.transaction();

  try {
    const cart = await db.Cart.findByPk(cart_id, {
      include: [
        {
          model: db.CartItem,
          as: "cart_items",
          include: [
            {
              model: db.Product,
              as: "product",
            },
            {
              model: db.ProductVariant,
              as: "product_variant",
            },
          ],
        },
      ],
    });

    if (!cart || !cart.cart_items.length) {
      return res.status(404).json({
        message:
          "Giỏ hàng không tồn tại hoặc là bạn chưa thêm sản phẩm nào vào giỏ hàng",
      });
    }

    // Calculate total price accurately supporting variants
    const calculatedTotal = cart.cart_items.reduce((acc, item) => {
      const price = (item.product_variant && item.product_variant.price !== null && item.product_variant.price !== undefined)
        ? item.product_variant.price
        : (item.product ? item.product.price : 0);
      return acc + (item.quantity * price);
    }, 0);

    //create new Order
    const newOrder = await db.Order.create(
      {
        user_id: cart.user_id,
        session_id: cart.session_id,
        total: calculatedTotal, // Luôn dùng giá tính từ server, bỏ qua giá từ client
        note: note,
        phone: phone || null,
        address: address || null,
        status: OrderStatus.PENDING,
      },
      { transaction: transaction }
    );
    //Insert Cart Item to order details and update stock/popularity
    for (let item of cart.cart_items) {
      const itemPrice = (item.product_variant && item.product_variant.price !== null && item.product_variant.price !== undefined)
        ? item.product_variant.price
        : (item.product ? item.product.price : 0);

      // Create OrderDetail record
      await db.OrderDetail.create(
        {
          order_id: newOrder.id,
          product_id: item.product_id,
          product_variant_id: item.product_variant_id || null,
          quantity: item.quantity,
          price: itemPrice,
        },
        { transaction: transaction }
      );

      // Deduct inventory from variant or product
      if (item.product_variant_id) {
        const variant = await db.ProductVariant.findByPk(item.product_variant_id, { transaction });
        if (!variant) {
          throw new Error(`Biến thể sản phẩm với ID ${item.product_variant_id} không tồn tại`);
        }
        if (variant.quantity < item.quantity) {
          const productName = item.product ? item.product.name : `ID ${item.product_id}`;
          throw new Error(`Số lượng trong kho không đủ cho biến thể của sản phẩm: ${productName}`);
        }
        variant.quantity -= item.quantity;
        await variant.save({ transaction });

        // Update buyturn for the base product
        const productForBuyturn = await db.Product.findByPk(item.product_id, { transaction });
        if (productForBuyturn) {
          productForBuyturn.buyturn = (productForBuyturn.buyturn || 0) + item.quantity;
          await productForBuyturn.save({ transaction });
        }
      } else {
        const product = await db.Product.findByPk(item.product_id, { transaction });
        if (!product) {
          throw new Error(`Sản phẩm với ID ${item.product_id} không tồn tại`);
        }
        if (product.quantity < item.quantity) {
          throw new Error(`Số lượng trong kho không đủ cho sản phẩm: ${product.name}`);
        }
        product.quantity -= item.quantity;
        // Cập nhật buyturn ngay trên product đã fetch, tránh query lần 2
        product.buyturn = (product.buyturn || 0) + item.quantity;
        await product.save({ transaction });
      }
    }
    await db.CartItem.destroy({
      where: { cart_id: cart.id },
      transaction: transaction,
    });
    await cart.destroy({ transaction: transaction });
    await transaction.commit();
    return res.status(200).json({
      message: "Thanh toán giỏ hàng thành công",
      data: newOrder,
    });
  } catch (error) {
    console.error("CHECKOUT ERROR DETAIL:", error);
    await transaction.rollback();
    return res.status(500).json({
      message: "Lỗi khi thanh toán giỏ hàng",
      error: error.message,
    });
  }
};

export const updateCart = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedCart = await db.Cart.update(req.body, {
      where: { id },
    });

    if (updatedCart[0] > 0) {
      res.status(200).json({
        message: "Cập nhật giỏ hàng thành công",
      });
    } else {
      res.status(404).json({
        message: "Giỏ hàng không tìm thấy",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi cập nhật giỏ hàng",
      error: error.message,
    });
  }
};
export const deleteCart = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await db.Cart.destroy({
      where: { id },
    });

    if (deleted) {
      return res.status(200).json({
        message: "Xóa giỏ hàng thành công",
      });
    } else {
      return res.status(404).json({
        message: "Giỏ hàng không tìm thấy",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi xóa giỏ hàng",
      error: error.message,
    });
  }
};

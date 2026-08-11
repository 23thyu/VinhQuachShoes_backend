import { Sequelize, where } from "sequelize";
import db from "../models";
const { Op } = Sequelize;
import { GetImageURL } from "../helpers/imageHelper.js";

const formatOrderDetail = (od) => {
  if (!od) return null;
  const plain = od.get({ plain: true });
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

export const getOrderDetails = async (req, res) => {
  try {
    const order_details = await db.OrderDetail.findAll({
      include: [
        { model: db.Product, as: "product" },
        {
          model: db.ProductVariant,
          as: "product_variant",
          include: [{ model: db.ProductVariantDetail, as: "details" }],
        },
      ],
    });
    res.status(200).json({
      message: "Lấy danh sách chi tiết đơn hàng thành công",
      data: order_details.map(formatOrderDetail),
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách chi tiết đơn hàng",
      error: error.message,
    });
  }
};

export const getOrderDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const order_details = await db.OrderDetail.findByPk(id, {
      include: [
        { model: db.Product, as: "product" },
        {
          model: db.ProductVariant,
          as: "product_variant",
          include: [{ model: db.ProductVariantDetail, as: "details" }],
        },
      ],
    });

    if (order_details) {
      res.status(200).json({
        message: "Lấy thông tin chi tiết đơn hàng thành công",
        data: formatOrderDetail(order_details),
      });
    } else {
      res.status(404).json({
        message: "Chi tiết đơn hàng không tìm thấy",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy chi tiết đơn hàng",
      error: error.message,
    });
  }
};

export const insertOrderDetail = async (req, res) => {
  let { price, product_id, product_variant_id } = req.body;

  if (price === undefined || price === null) {
    if (product_variant_id) {
      const variant = await db.ProductVariant.findByPk(product_variant_id);
      if (variant && variant.price !== null && variant.price !== undefined) {
        price = variant.price;
      }
    }
    if (price === undefined || price === null) {
      const product = await db.Product.findByPk(product_id);
      if (product) {
        price = product.price;
      }
    }
  }
  req.body.price = price || 0;

  const newOrderDetail = await db.OrderDetail.create(req.body);
  res.status(201).json({
    message: "Thêm chi tiết đơn hàng thành công",
    data: newOrderDetail,
  });
};

export async function deleteOrderDetail(req, res) {
  const { id } = req.params;
  const deletedCount = await db.OrderDetail.destroy({
    where: { id },
  });

  if (deletedCount > 0) {
    return res.status(200).json({
      message: "Xóa chi tiết đơn hàng thành công",
    });
  } else {
    return res.status(404).json({
      message: "Chi tiết đơn hàng không tìm thấy",
    });
  }
}

export async function updateOrderDetail(req, res) {
  const { id } = req.params;
  const updatedOrderDetail = await db.OrderDetail.update(req.body, {
    where: { id },
  });

  if (updatedOrderDetail[0] > 0) {
    return res.status(200).json({
      message: "Cập nhật chi tiết đơn hàng thành công",
    });
  } else {
    return res.status(404).json({
      message: "Chi tiết đơn hàng không tìm thấy",
    });
  }
}

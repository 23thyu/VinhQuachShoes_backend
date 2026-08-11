import { Sequelize, where } from "sequelize";
import db from "../models";
const { Op } = Sequelize;
import OrderStatus from "../constants/OrderStatus";
import UserRole from "../constants/UserRole.js";
import { GetImageURL } from "../helpers/imageHelper.js";

export async function getOrders(req, res) {
  const { search = "", page = 1, status = "", limit } = req.query;
  const pageSize = 10;
  const offset = (page - 1) * pageSize;
  let whereClause = {};
  if (search.trim() !== "") {
    whereClause = {
      [Op.or]: [{ note: { [Op.like]: `%${search}%` } }],
    };
  }
  if (status) {
    whereClause.status = status;
  }
  if (req.user && req.user.role !== UserRole.ADMIN) {
    whereClause.user_id = req.user.id;
  }

  const queryOptions = {
    where: whereClause,
    order: [["created_at", "DESC"]],
    include: [
      {
        model: db.User,
        as: "user",
        attributes: ["id", "name", "phone", "email"],
      },
    ],
  };
  if (limit !== "all") {
    queryOptions.limit = pageSize;
    queryOptions.offset = offset;
  }

  const orders = await db.Order.findAll(queryOptions);

  const count = await db.Order.count({
    where: whereClause,
  });

  res.status(200).json({
    message: "Lấy danh sách đơn hàng thành công",
    data: orders,
    current_page: parseInt(page, 10),
    total_page: Math.ceil(count / pageSize),
    total: count,
  });
}

//   const { user_id } = req.query;

//   const whereClause = {};
//   if (user_id) {
//     whereClause.user_id = user_id;
//   }

//   const orders = await db.Order.findAll({
//     where: whereClause,
//   });

//   res
//     .status(200)
//     .json({ message: "Lấy danh sách đơn hàng thành công", data: orders });
// }

export async function getOrderById(req, res) {
  const { id } = req.params;
  const order = await db.Order.findOne({
    where: { id },
    include: [
      {
        model: db.User,
        as: "user",
        attributes: ["id", "name", "phone", "email"],
      },
      {
        model: db.OrderDetail,
        as: "order_details",
        include: [
          {
            model: db.Product,
            as: "product",
          },
          {
            model: db.ProductVariant,
            as: "product_variant",
            include: [
              {
                model: db.ProductVariantDetail,
                as: "details",
              },
            ],
          },
        ],
      },
    ],
  });
  if (!order) {
    return res.status(404).json({
      message: "Không tìm thấy đơn hàng",
    });
  }
  res
    .status(200)
    .json({ message: "Lấy thông tin đơn hàng thành công", data: order });
}
export async function insertOrder(req, res) {
  const userId = req.body.user_id; // Assuming the user_id is provided in the request body

  // Check if the user exists in the database
  const userExists = await db.User.findByPk(userId);
  if (!userExists) {
    // If the user does not exist, return a 404 Not Found error
    return res.status(404).json({
      message: "Người dùng không tồn tại",
    });
  }

  // If the user exists, create the order
  const newOrder = await db.Order.create(req.body);
  if (newOrder) {
    res.status(201).json({
      message: "Thêm mới đơn hàng thành công",
      data: newOrder,
    });
  } else {
    // Handle cases where the order could not be created
    res.status(400).json({
      message: "Không thể thêm đơn hàng",
    });
  }
}

export async function deleteOrder(req, res) {
  const { id } = req.params;
  const [update] = await db.Order.update(
    {
      status: OrderStatus.FAILED,
    },
    {
      where: { id },
    }
  );

  if (update) {
    return res.status(200).json({
      message: "Đơn hàng đã FAILED",
    });
  } else {
    return res.status(404).json({
      message: "Đơn hàng không tìm thấy",
    });
  }
}

export async function updateOrder(req, res) {
  try {
    const { id } = req.params;
    const bodyData = { ...req.body };

    if (bodyData.status !== undefined) {
      const statusMap = {
        pending: OrderStatus.PENDING,       // 1
        processing: OrderStatus.PROCESSING, // 2
        shipped: OrderStatus.SHIPPING,      // 3
        shipping: OrderStatus.SHIPPING,     // 3
        delivered: OrderStatus.DELIVERED,   // 4
        cancelled: OrderStatus.CANCELLED,   // 5
        refunded: OrderStatus.REFUNDED,     // 6
        failed: OrderStatus.FAILED,         // 7
        "1": 1,
        "2": 2,
        "3": 3,
        "4": 4,
        "5": 5,
        "6": 6,
        "7": 7
      };

      const mappedStatus = statusMap[String(bodyData.status).toLowerCase()];
      if (mappedStatus !== undefined) {
        bodyData.status = mappedStatus;
      }
    }

    const updatedOrder = await db.Order.update(bodyData, {
      where: { id },
    });

    if (updatedOrder[0] > 0) {
      return res.status(200).json({
        message: "Cập nhật đơn hàng thành công",
        data: bodyData
      });
    } else {
      return res.status(404).json({
        message: "Đơn hàng không tìm thấy",
      });
    }
  } catch (error) {
    console.error("Update order error:", error);
    return res.status(500).json({
      message: "Lỗi server khi cập nhật đơn hàng",
      error: error.message
    });
  }
}

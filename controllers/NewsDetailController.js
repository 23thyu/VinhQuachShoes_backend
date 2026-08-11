import db from "../models";
import { Sequelize } from "sequelize";
import { GetImageURL } from "../helpers/imageHelper.js";
const { Op } = Sequelize;

// Lấy danh sách chi tiết tin tức (có phân trang)
export const getNewsDetails = async (req, res) => {
  const { page = 1 } = req.query;
  const pageSize = 5;
  const offset = (page - 1) * pageSize;

  const [newsDetails, totalNewsDetails] = await Promise.all([
    db.NewsDetails.findAll({
      limit: pageSize,
      offset: offset,
      include: [
        { model: db.News, as: "news" },
        { model: db.Product, as: "product" },
      ],
    }),
    db.NewsDetails.count(),
  ]);

  return res.status(200).json({
    message: "Lấy danh sách chi tiết tin tức thành công",
    data: newsDetails,
    current_page: parseInt(page, 10),
    total_page: Math.ceil(totalNewsDetails / pageSize),
    total: totalNewsDetails,
  });
};

// Lấy chi tiết tin tức theo id
export async function getNewsDetailById(req, res) {
  const { id } = req.params;
  const newsDetail = await db.NewsDetails.findByPk(id, {
    include: [
      { model: db.News, as: "news" },
      { model: db.Product, as: "product" },
    ],
  });
  if (!newsDetail) {
    return res.status(404).json({
      message: "Không tìm thấy chi tiết tin tức",
    });
  }
  return res.status(200).json({
    message: "Lấy chi tiết tin tức thành công",
    data: newsDetail,
  });
}

// Thêm mới chi tiết tin tức
export async function insertNewsDetail(req, res) {
  const { product_id, news_id } = req.body;
  const productExists = await db.Product.findByPk(product_id);
  if (!productExists) {
    return res.status(404).json({
      message: "Sản phẩm không tồn tại",
    });
  }

  // Kiểm tra tin tức có tồn tại không
  const newsExists = await db.News.findByPk(news_id);
  if (!newsExists) {
    return res.status(404).json({
      message: "Tin tức không tồn tại",
    });
  }
  // Kiểm tra trùng lặp trước khi tạo mới chi tiết tin tức
  const duplicateExists = await db.NewsDetails.findOne({
    where: { news_id, product_id },
  });
  if (duplicateExists) {
    return res.status(409).json({
      message: "Mối quan hệ giữa sản phẩm và tin tức đã tồn tại",
    });
  }
  // Nếu không trùng, tiếp tục tạo mới chi tiết tin tức

  // Nếu cả hai đều tồn tại, tạo mới chi tiết tin tức
  const newsDetail = await db.NewsDetails.create({ product_id, news_id });

  return res.status(201).json({
    message: "Thêm mới chi tiết tin tức thành công",
    data: newsDetail,
  });
}

// Xóa chi tiết tin tức
export const deleteNewsDetail = async (req, res) => {
  const { id } = req.params;
  const deleted = await db.NewsDetails.destroy({
    where: { id },
  });
  if (deleted) {
    return res.status(200).json({
      message: "Xóa chi tiết tin tức thành công",
    });
  } else {
    return res.status(404).json({
      message: "Không tìm thấy chi tiết tin tức để xóa",
    });
  }
};

// Cập nhật chi tiết tin tức
export async function updateNewsDetail(req, res) {
  const { id } = req.params;
  const { product_id, news_id } = req.body;

  // Kiểm tra trùng lặp (ngoại trừ bản ghi hiện tại)
  const existingDuplicate = await db.NewsDetails.findOne({
    where: {
      product_id,
      news_id,
      id: { [Sequelize.Op.ne]: id }, // Loại trừ bản ghi hiện tại
    },
  });
  if (existingDuplicate) {
    return res.status(409).json({
      message:
        "Mối quan hệ giữa sản phẩm và tin tức đã tồn tại trong bản ghi khác",
    });
  }

  const updatedNewsDetail = await db.NewsDetails.update(
    { product_id, news_id },
    { where: { id } }
  );

  if (updatedNewsDetail[0] > 0) {
    return res.status(200).json({
      message: "Cập nhật chi tiết tin tức thành công",
    });
  } else {
    return res.status(404).json({
      message: "Chi tiết tin tức không tìm thấy",
    });
  }
}

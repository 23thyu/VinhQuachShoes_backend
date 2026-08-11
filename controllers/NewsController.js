import db from "../models";
import { Sequelize } from "sequelize";
import { GetImageURL } from "../helpers/imageHelper.js";
const { Op } = Sequelize;
export const getNewsArticles = async (req, res) => {
  const { search = "", page = 1, product_id, limit } = req.query;
  const pageSize = 5;
  const offset = (page - 1) * pageSize;

  let whereClause = {};
  if (search.trim() !== "") {
    whereClause = {
      [Op.or]: [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } },
      ],
    };
  }

  let includeClause = [
    {
      model: db.NewsDetails,
      as: "newsDetails",
      where: product_id ? { product_id: product_id } : undefined,
      required: product_id ? true : false,
      include: [{ model: db.Product, as: "product" }],
    },
  ];

  const queryOptions = {
    where: whereClause,
    include: includeClause,
  };
  if (limit !== "all") {
    queryOptions.limit = pageSize;
    queryOptions.offset = offset;
  }

  try {
    const [newsArticles, totalNews] = await Promise.all([
      db.News.findAll(queryOptions),
      db.News.count({
        where: whereClause,
        include: includeClause,
        distinct: true,
      }),
    ]);

    res.status(200).json({
      message: "Lấy danh sách bài viết thành công",
      data: newsArticles,
      current_page: parseInt(page, 10),
      total_page: Math.ceil(totalNews / pageSize),
      total: totalNews,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách bài viết",
      error: error.message,
    });
  }
};
export async function getNewsArticleById(req, res) {
  try {
    const { id } = req.params;
    const newsArticle = await db.News.findByPk(id, {
      include: [
        {
          model: db.NewsDetails,
          as: "newsDetails",
          include: [{ model: db.Product, as: "product" }],
        },
      ],
    });
    if (!newsArticle) {
      return res.status(404).json({
        message: "Bài viết không tìm thấy",
      });
    }
    res.status(200).json({
      message: "Lấy bài viết thành công",
      data: newsArticle,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy bài viết",
      error: error.message,
    });
  }
}
export async function insertNewsArticle(req, res) {
  // Start a transaction
  const transaction = await db.sequelize.transaction();

  try {
    // Create the news article within the transaction
    const newsArticle = await db.News.create(req.body, { transaction });

    // Validate product IDs if provided
    const productIds = req.body.product_ids;
    if (productIds && productIds.length) {
      // Fetch all products that match the given IDs
      const validProducts = await db.Product.findAll({
        where: { id: productIds },
        transaction,
      });

      // Extract valid IDs from the validProducts
      const validProductIds = validProducts.map((product) => product.id);

      // Filter out any invalid IDs from the request
      const filteredProductIds = productIds.filter((id) =>
        validProductIds.includes(id)
      );

      // Create NewsDetails entries only for valid product IDs
      const newsDetailPromises = filteredProductIds.map((product_id) =>
        db.NewsDetails.create(
          {
            product_id: product_id,
            news_id: newsArticle.id,
          },
          { transaction }
        )
      );

      // Execute all creation operations for NewsDetail
      await Promise.all(newsDetailPromises);
    }

    // Commit the transaction if all operations were successful
    await transaction.commit();
    res.status(201).json({
      message: "Thêm mới bài báo thành công",
      data: newsArticle,
    });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      message: "Lỗi khi thêm mới bài báo",
      error: error.message,
    });
  }
}

export const deleteNewsArticle = async (req, res) => {
  const { id } = req.params;
  const transaction = await db.sequelize.transaction();

  try {
    // Xóa news details trước (cascade), dùng đúng tên model NewsDetails
    await db.NewsDetails.destroy({
      where: { news_id: id },
      transaction,
    });
    const deletedCount = await db.News.destroy({
      where: { id },
      transaction,
    });

    if (deletedCount) {
      await transaction.commit();
      return res.status(200).json({
        message: "Xóa bài báo thành công",
      });
    } else {
      await transaction.rollback();
      return res.status(404).json({
        message: "Bài báo không tìm thấy",
      });
    }
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: "Lỗi khi xóa bài báo",
      error: error.message,
    });
  }
};

export async function updateNewsArticle(req, res) {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const existingArticle = await db.News.findOne({
      where: {
        title: title,
        id: { [db.Sequelize.Op.ne]: id },
      },
    });
    if (existingArticle) {
      return res.status(400).json({
        message: "Tiêu đề bài báo đã tồn tại, vui lòng chọn tiêu đề khác.",
      });
    }
    const updatedNewsArticle = await db.News.update(req.body, { where: { id } });
    if (updatedNewsArticle[0] > 0) {
      return res.status(200).json({
        message: "Cập nhật bài báo thành công",
      });
    } else {
      return res.status(404).json({
        message: "Bài báo không tìm thấy",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi cập nhật bài báo",
      error: error.message,
    });
  }
}

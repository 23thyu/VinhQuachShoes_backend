import db from "../models";
import { GetImageURL } from "../helpers/imageHelper.js";

const formatVariant = (variant) => {
  if (!variant) return null;
  const plain = variant.get({ plain: true });
  if (plain.image) {
    plain.image = GetImageURL(plain.image);
  }
  if (plain.details) {
    plain.details = plain.details.map((d) => ({
      ...d,
      image: GetImageURL(d.image),
    }));
  }
  return plain;
};

export async function getVariantsByProductId(req, res) {
  const { productId } = req.params;
  try {
    const product = await db.Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        message: "Sản phẩm không tồn tại",
      });
    }

    const variants = await db.ProductVariant.findAll({
      where: { product_id: productId },
      include: [
        {
          model: db.ProductVariantDetail,
          as: "details",
        },
      ],
    });

    return res.status(200).json({
      message: "Lấy danh sách biến thể sản phẩm thành công",
      data: variants.map(formatVariant),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi lấy danh sách biến thể",
      error: error.message,
    });
  }
}

export async function insertProductVariant(req, res) {
  try {
    const { product_id, attributes = {}, attribute_images = {} } = req.body;
    const product = await db.Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        message: "Sản phẩm không tồn tại",
      });
    }

    const variant = await db.ProductVariant.create(req.body);

    const detailsData = Object.entries(attributes).map(([key, val]) => ({
      product_variant_id: variant.id,
      attribute_name: key,
      attribute_value: String(val),
      image: attribute_images[key] || null,
    }));

    if (detailsData.length > 0) {
      await db.ProductVariantDetail.bulkCreate(detailsData);
    }

    const fullVariant = await db.ProductVariant.findByPk(variant.id, {
      include: [{ model: db.ProductVariantDetail, as: "details" }],
    });

    return res.status(201).json({
      message: "Thêm biến thể sản phẩm thành công",
      data: formatVariant(fullVariant),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi thêm biến thể sản phẩm",
      error: error.message,
    });
  }
}

export async function updateProductVariant(req, res) {
  const { id } = req.params;
  try {
    const variant = await db.ProductVariant.findByPk(id);
    if (!variant) {
      return res.status(404).json({
        message: "Biến thể sản phẩm không tồn tại",
      });
    }

    await db.ProductVariant.update(req.body, {
      where: { id },
    });

    if (req.body.attributes) {
      await db.ProductVariantDetail.destroy({
        where: { product_variant_id: id },
      });
      const attribute_images = req.body.attribute_images || {};
      const detailsData = Object.entries(req.body.attributes).map(([key, val]) => ({
        product_variant_id: id,
        attribute_name: key,
        attribute_value: String(val),
        image: attribute_images[key] || null,
      }));
      if (detailsData.length > 0) {
        await db.ProductVariantDetail.bulkCreate(detailsData);
      }
    }

    const updatedVariant = await db.ProductVariant.findByPk(id, {
      include: [{ model: db.ProductVariantDetail, as: "details" }],
    });
    return res.status(200).json({
      message: "Cập nhật biến thể sản phẩm thành công",
      data: formatVariant(updatedVariant),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi cập nhật biến thể sản phẩm",
      error: error.message,
    });
  }
}

export async function deleteProductVariant(req, res) {
  const { id } = req.params;
  try {
    const deletedCount = await db.ProductVariant.destroy({
      where: { id },
    });

    if (deletedCount > 0) {
      return res.status(200).json({
        message: "Xóa biến thể sản phẩm thành công",
      });
    } else {
      return res.status(404).json({
        message: "Biến thể sản phẩm không tồn tại",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi khi xóa biến thể sản phẩm",
      error: error.message,
    });
  }
}

export async function bulkSaveVariants(req, res) {
  const productId = req.params.productId || req.body.product_id;
  const { variants = [] } = req.body;

  const transaction = await db.sequelize.transaction();
  try {
    const product = await db.Product.findByPk(productId, { transaction });
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Sản phẩm không tồn tại",
      });
    }

    // 1. Delete variants that are not present in the new list
    const keepIds = variants.map((v) => v.id).filter((id) => id);
    const deleteWhere = { product_id: productId };
    if (keepIds.length > 0) {
      deleteWhere.id = { [db.Sequelize.Op.notIn]: keepIds };
    }
    await db.ProductVariant.destroy({ where: deleteWhere, transaction });

    // 2. Save (insert/update) variants and their details
    const savedVariants = [];
    for (const vData of variants) {
      let variant;
      if (vData.id) {
        // Update existing variant
        variant = await db.ProductVariant.findByPk(vData.id, { transaction });
        if (variant) {
          variant.price = vData.price === "" ? null : vData.price;
          variant.quantity = vData.quantity;
          variant.image = vData.image || null;
          variant.attributes = vData.attributes || {};
          await variant.save({ transaction });
        }
      }
      
      if (!variant) {
        // Create new variant
        variant = await db.ProductVariant.create({
          product_id: productId,
          price: vData.price === "" ? null : vData.price,
          quantity: vData.quantity,
          image: vData.image || null,
          attributes: vData.attributes || {},
        }, { transaction });
      }

      // Recreate details for this variant
      await db.ProductVariantDetail.destroy({
        where: { product_variant_id: variant.id },
        transaction,
      });

      const attribute_images = vData.attribute_images || {};
      const detailsData = Object.entries(vData.attributes || {}).map(([key, val]) => ({
        product_variant_id: variant.id,
        attribute_name: key,
        attribute_value: String(val),
        image: attribute_images[key] || null,
      }));

      if (detailsData.length > 0) {
        await db.ProductVariantDetail.bulkCreate(detailsData, { transaction });
      }

      // Fetch full variant with details to return
      const fullVariant = await db.ProductVariant.findByPk(variant.id, {
        include: [{ model: db.ProductVariantDetail, as: "details" }],
        transaction,
      });
      savedVariants.push(formatVariant(fullVariant));
    }

    await transaction.commit();
    return res.status(200).json({
      message: `Đã lưu biến thể thành công, tạo ra được ${savedVariants.length} biến thể`,
      data: savedVariants,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: "Lỗi khi lưu danh sách biến thể",
      error: error.message,
    });
  }
}


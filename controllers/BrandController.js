import { Sequelize } from "sequelize";
import db from "../models";
import { GetImageURL } from "../helpers/imageHelper.js";
export async function getBrands(req, res) {
  try {
    const brands = await db.Brand.findAll();
    res.status(200).json({
      message: "Lấy danh sách thương hiệu thành công",
      data: brands.map((brand) => ({
        ...brand.get({ plain: true }),
        image: GetImageURL(brand.image),
      })),
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách thương hiệu",
      error: error.message,
    });
  }
}

export async function getBrandById(req, res) {
  try {
    const { id } = req.params;
    const brand = await db.Brand.findByPk(id);
    if (!brand) {
      return res.status(404).json({
        message: "Thương hiệu không tìm thấy",
      });
    }
    res.status(200).json({
      message: "Lấy thương hiệu thành công",
      data: {
        ...brand.get({ plain: true }),
        image: GetImageURL(brand.image),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy thương hiệu",
      error: error.message,
    });
  }
}

export async function insertBrand(req, res) {
  try {
    // console.log(JSON.stringify(req.body));

    const brand = await db.Brand.create(req.body);
    res
      .status(201)
      .json({ message: "Thêm thương hiệu thành công", data: brand });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi thêm thương hiệu",
      error: error.message,
    });
  }
}
export async function deleteBrand(req, res) {
  try {
    const { id } = req.params;
    const deleted = await db.Brand.destroy({
      where: { id },
    });
    if (deleted) {
      return res.status(200).json({
        message: "Xóa thương hiệu thành công",
      });
    } else {
      return res.status(404).json({
        message: "Thương hiệu không tìm thấy",
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi xóa thương hiệu",
      error: error.message,
    });
  }
}

export async function updateBrand(req, res) {
  const { id } = req.params;
  const updatedBrand = await db.Brand.update(req.body, {
    where: { id },
  });

  if (updatedBrand[0] > 0) {
    return res.status(200).json({
      message: "Cập nhật thương hiệu thành công",
    });
  } else {
    return res.status(404).json({
      message: "Thương hiệu không tìm thấy",
    });
  }
}

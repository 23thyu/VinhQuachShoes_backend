import path from "path";
import fs from "fs";
import { GetImageURL } from "../helpers/imageHelper.js";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import db from "../models";
import cloudinary, { uploadToCloudinary } from "../config/cloudinaryConfig.js";

export async function uploadImages(req, res) {
  if (req.files.length === 0) {
    return res.status(400).json({ error: "No files were uploaded." });
  }

  const uploadedImagesPaths = req.files.map((file) => path.basename(file.path).trim());
  return res.status(200).json({
    files: uploadedImagesPaths,
    message: "Images uploaded successfully.",
  });
}
export async function viewImage(req, res) {
  const { fileName } = req.params;
  const imagePath = path.join(__dirname, "../uploads", fileName);
  fs.access(imagePath, fs.constants.F_OK, (error) => {
    if (error) {
      return res.status(404).json({ error: "Image not found." });
    }
    res.sendFile(imagePath);
  });
}

// export async function deleteImage(req, res) {
//   try {
//     const { fileName } = req.params;

//     // Trim any spaces from the URL to ensure accurate comparison and file operations
//     const cleanFileName = fileName.trim();

//     // Construct the file path
//     const imagePath = path.join(__dirname, "../uploads", cleanFileName);

//     // Check if file exists before trying to delete
//     if (!fs.existsSync(imagePath)) {
//       return res.status(404).json({
//         error: "Image not found",
//         message: "Không tìm thấy file ảnh",
//       });
//     }

//     // Delete the file
//     fs.unlinkSync(imagePath);

//     return res.status(200).json({
//       message: "Ảnh đã được xóa thành công",
//       fileName: cleanFileName,
//     });
//   } catch (error) {
//     console.error("Error in deleteImage:", error);
//     return res.status(500).json({
//       error: "Internal server error",
//       message: "Lỗi khi xóa ảnh",
//       details: error.message,
//     });
//   }
// }
async function checkImageInUse(imageUrl) {
  if (!imageUrl) return false;
  const cleanImage = imageUrl.trim();
  const baseName = path.basename(cleanImage);
  const searchQueries = [cleanImage, baseName];

  // Kiểm tra bảng User (sử dụng cột 'avatar' thay vì 'image')
  for (const query of searchQueries) {
    const user = await db.User.findOne({ where: { avatar: query } });
    if (user) return true;
  }

  // Kiểm tra các bảng khác (sử dụng cột 'image')
  const models = [db.Category, db.Brand, db.Product, db.News, db.Banner];
  for (const model of models) {
    for (const query of searchQueries) {
      const result = await model.findOne({ where: { image: query } });
      if (result) return true;
    }
  }
  return false;
}

export async function deleteImage(req, res) {
  const { url: rawUrl } = req.body;

  try {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return res.status(400).json({ message: 'URL không được để trống' });
    }

    // Trim any spaces around the URL to ensure accurate comparison and file operations
    const url = rawUrl.trim();

    // Kiểm tra xem ảnh có đang được sử dụng ở đâu không
    const inUse = await checkImageInUse(url);
    if (inUse) {
      return res.status(400).json({ message: 'Ảnh đang được sử dụng, không thể xoá!' });
    }

    if (url.includes('https://firebasestorage.googleapis.com/')) {
      const storage = getStorage();
      const fileRef = ref(storage, url);

      // Delete the file from Firebase Storage
      await deleteObject(fileRef);
      res.status(200).json({ message: 'Ảnh đã được xoá thành công' });
    } else if (url.includes('res.cloudinary.com')) {
      // URL format: .../image/upload/v123456789/folder/public_id.jpg or .../image/upload/folder/public_id.jpg
      const uploadIndex = url.indexOf('/image/upload/');
      if (uploadIndex !== -1) {
        let pathPart = url.substring(uploadIndex + '/image/upload/'.length);
        // Remove version number like v12345678/ if present
        pathPart = pathPart.replace(/^v\d+\//, '');
        // Remove file extension
        const lastDot = pathPart.lastIndexOf('.');
        const publicId = lastDot !== -1 ? pathPart.substring(0, lastDot) : pathPart;

        await cloudinary.uploader.destroy(publicId);
        res.status(200).json({ message: 'Ảnh đã được xoá thành công khỏi Cloudinary' });
      } else {
        res.status(400).json({ message: 'URL Cloudinary không đúng định dạng' });
      }
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Assume url is a local filename
      const filePath = path.join(__dirname, '../uploads/', path.basename(url));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.status(200).json({ message: 'Ảnh đã được xoá thành công' });
      } else {
        res.status(404).json({ message: 'Không tìm thấy ảnh' });
      }
    } else {
      res.status(400).json({ message: 'URL không hợp lệ' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xoá ảnh', error: error.message });
  }
}



export async function uploadImageGoogle(req, res) {
  try {
    // 1. Kiểm tra xem có file gửi lên không
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Không có file nào được tải lên." });
    }

    const storage = getStorage();
    const file = req.files[0]; // Lấy file đầu tiên

    // 2. Tạo đường dẫn và tên file duy nhất trên Firebase
    const newFileName = `${Date.now()}-${file.originalname}`;
    const storageRef = ref(storage, `images/${newFileName}`);

    // 3. Khởi tạo thuộc tính của file
    const metadata = {
      contentType: file.mimetype,
    };

    // 4. Upload file dạng buffer lên Firebase (yêu cầu multer cấu hình memoryStorage)
    const snapshot = await uploadBytesResumable(storageRef, file.buffer, metadata);

    // 5. Lấy link ảnh công khai
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("File đã tải lên Firebase thành công:", downloadURL);

    // 6. Trả về cho client
    return res.status(200).json({
      message: "Tải ảnh lên Firebase thành công.",
      url: downloadURL.trim(), // Trả về URL để lưu vào database
    });

  } catch (error) {
    console.error("Lỗi khi upload lên Firebase:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Lỗi hệ thống khi tải ảnh lên Firebase",
      details: error.message,
    });
  }
}

export async function uploadImageCloudinary(req, res) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "Không có file nào được tải lên." });
    }

    // Upload song song các file lên Cloudinary
    const uploadPromises = req.files.map((file) => uploadToCloudinary(file.buffer, "shopapp"));
    const results = await Promise.all(uploadPromises);

    const urls = results.map((result) => result.secure_url);
    console.log("Các file đã tải lên Cloudinary thành công:", urls);

    return res.status(200).json({
      message: "Tải ảnh lên Cloudinary thành công.",
      urls: urls,
      url: urls[0], // Để tương thích ngược nếu chỉ cần 1 URL duy nhất
    });

  } catch (error) {
    console.error("Lỗi khi upload lên Cloudinary:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: "Lỗi hệ thống khi tải ảnh lên Cloudinary",
      details: error.message,
    });
  }
}
import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary using a stream.
 * @param {Buffer} fileBuffer - The file buffer from multer.
 * @param {string} folder - The folder name on Cloudinary.
 * @returns {Promise<object>} The Cloudinary upload result.
 */
export const uploadToCloudinary = (fileBuffer, folder = "shopapp") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto",
        fetch_format: "auto",
        quality: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        if (result && result.secure_url) {
          result.secure_url = result.secure_url.replace(/\.(heic|heif)$/i, ".jpg");
        }
        resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export default cloudinary;

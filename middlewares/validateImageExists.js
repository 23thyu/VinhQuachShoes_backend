import path from "path";
import fs from "fs";
const validateImageExists = (req, res, next) => {
  const imageName = req.body.image;

  // Only proceed with validation if imageName has a non-empty value
  if (
    imageName &&
    !imageName.startsWith("http://") &&
    !imageName.startsWith("https://")
  ) {
    const imagePath = path.join(__dirname, "..", "uploads", imageName);

    // Check if the image file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        message: "File ảnh không tồn tại",
      });
    }
  }

  // If imageName is empty or a URL, or the file exists, continue to the next middleware
  next();
};

export default validateImageExists;

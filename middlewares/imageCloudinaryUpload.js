import multer from "multer";

const fileFilter = (req, file, callback) => {
    if (file.mimetype.startsWith("image/")) {
        callback(null, true);
    } else {
        callback(new Error("Chỉ được phép tải lên hình ảnh"), false);
    }
};

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn kích thước tệp là 5MB
    },
});

export default upload;

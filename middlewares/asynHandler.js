// async function asyncHandler(fun) {

// }
const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      console.error("Async Handler Error:", error);
      return res.status(500).json({
        message: "Internal Server error",
        error: process.env.NODE_ENV === "development" ? (error.message || error.toString()) : undefined,
      });
    }
  };
};
export default asyncHandler;

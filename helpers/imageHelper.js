import os from "os";


export const GetImageURL = (imageName) => {
  if (imageName && !imageName.includes("http")) {
    const API_PREFIX = `http://${os.hostname()}:${process.env.PORT || 3009}/api`;
    return `${API_PREFIX}/images/${imageName}`;
  }
  return imageName;
};

import { v2 as cloudinary } from "cloudinary";
import { ApiError } from "../utils/ApiError.util";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToClodinary = async (file: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (err, res) => {
        if (err) {
          reject(new ApiError("Error uploading to cloudinary!", 500));
        } else {
          resolve(res?.secure_url || "");
        }
      }
    );

    const readableStream = new Readable();
    readableStream.push(file._data);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

export const getCloudinaryPublicId = (url: string): string | null => {
  if (!url || !url.includes("cloudinary.com")) return null;
  const parts = url.split("/");
  const uploadIndex = parts.indexOf("upload");
  console.log("cloud -- 35 -- upInd -- ", uploadIndex);
  if (uploadIndex === -1 || uploadIndex + 2 >= parts.length) return null;

  const publicId = parts
    .slice(uploadIndex + 1)
    .join("/")
    .split(".")[0];
  return publicId;
};

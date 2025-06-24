process.env.YTDL_NO_UPDATE = "true";

const ytdl = require("ytdl-core");
const fs = require("fs");
const axios = require("axios");
const { v4 } = require("uuid");
const { uploadToS3 } = require("./uploadToS3");
const { getFbVideoInfo } = require("fb-downloader-scrapper");
const https = require("https");
const path = require("path");
const { downloadInstagramVideo } = require("speedydl");
const { TwitterDL } = require("twitter-downloader");

exports.extractVideoFromUrl = async (url) => {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    return await extractVideoFromYouTube(url);
  } else if (url.includes("instagram.com")) {
    return await extractVideoFromInstagram(url);
  } else if (url.includes("facebook.com")) {
    return await extractVideoFromFacebook(url);
  } else if (url.includes("twitter.com") || url.includes("x.com")) {
    return await extractVideoFromX(url);
  } else {
    throw new Error("Unsupported video platform");
  }
};

async function extractVideoFromYouTube(url) {
  try {
    const fileName = `${v4()}.mp4`;
    const localFilePath = `./${fileName}`;

    await new Promise((resolve, reject) => {
      ytdl(url, { quality: "highest" })
        .pipe(fs.createWriteStream(localFilePath))
        .on("finish", resolve)
        .on("error", reject);
    });

    const videoBuffer = fs.createReadStream(localFilePath);

    const videoData = await uploadToS3(videoBuffer, `test_videos/${fileName}`);

    fs.unlink(localFilePath, (err) => {
      if (err) {
        console.error("Error deleting the local file:", err);
      } else {
        console.log("Local file deleted successfully.");
      }
    });

    return videoData;
  } catch (error) {
    console.error("Error extracting YouTube video:", error.message);
    if (error.message.includes("Could not extract functions")) {
      throw new Error(
        "Failed to extract video due to signature extraction issues from YouTube. Please try again later."
      );
    }
    throw new Error("Error extracting YouTube video");
  }
}

async function extractVideoFromInstagram(url) {
  try {
    const igVideo = await downloadInstagramVideo(url);

    if (!igVideo.video || igVideo.video.length === 0) {
      throw new Error("No video URL found in response.");
    }

    const videoUrl = igVideo.video[0];
    const fileName = `${v4()}.mp4`;
    const outputPath = `./${fileName}`;

    const response = await axios.get(videoUrl, {
      responseType: "stream",
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "*/*",
      },
      maxRedirects: 5,
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const videoBuffer = fs.createReadStream(outputPath);
    const s3Key = `test_videos/${fileName}`;
    const videoData = await uploadToS3(videoBuffer, s3Key);

    fs.unlink(outputPath, (err) => {
      if (err) {
        console.error("Error deleting the local file:", err);
      } else {
        console.log("Local file deleted successfully.");
      }
    });

    return videoData;
  } catch (error) {
    console.error("Error extracting Instagram video:", error);
    throw new Error("Error extracting Instagram video");
  }
}

async function extractVideoFromFacebook(url) {
  try {
    const info = await getFbVideoInfo(url);
    const videoUrl = info.hd || info.sd;
    const filename =
      info.title.replace(/[^a-z0-9]/gi, "_").slice(0, 100) + ".mp4";
    const filePath = path.join("./", filename);

    const videoData = await new Promise((resolve, reject) => {
      https
        .get(videoUrl, (res) => {
          if (res.statusCode !== 200)
            return reject(new Error(`Bad status: ${res.statusCode}`));
          const file = fs.createWriteStream(filePath);
          res.pipe(file);
          file.on("finish", () => {
            file.close();
            console.log("✅ Downloaded to", filePath);
            resolve(filePath);
          });
        })
        .on("error", reject);
    });

    const videoBuffer = fs.createReadStream(videoData);
    const s3Key = `test_videos/${filename}`;
    const uploadResult = await uploadToS3(videoBuffer, s3Key);

    fs.unlink(videoData, (err) => {
      if (err) console.error("Failed to delete local file:", err);
    });

    return uploadResult;
  } catch (error) {
    console.error("Error extracting Facebook video:", error);
    throw new Error("Error extracting Facebook video");
  }
}

async function extractVideoFromX(url) {
  try {
    const result = await TwitterDL(url);

    if (
      result.status === "success" &&
      result.result.media &&
      result.result.media[0].type === "video"
    ) {
      const videoUrl = result.result.media[0].videos[0].url;
      const fileName = "twitter_video_" + Date.now() + ".mp4";
      const outputPath = path.join("./", fileName);

      const response = await axios({
        method: "GET",
        url: videoUrl,
        responseType: "stream",
      });

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      const videoBuffer = fs.createReadStream(outputPath);
      const s3Key = `test_videos/${fileName}`;
      const uploadResult = await uploadToS3(videoBuffer, s3Key);

      fs.unlink(outputPath, (err) => {
        if (err) console.error("Failed to delete local file:", err);
      });

      return uploadResult;
    } else {
      throw new Error("Failed to retrieve video URL");
    }
  } catch (error) {
    console.error("Error extracting X (Twitter) video:", error);
    throw new Error("Error extracting X (Twitter) video");
  }
}

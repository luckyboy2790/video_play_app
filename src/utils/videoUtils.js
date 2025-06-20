process.env.YTDL_NO_UPDATE = "true";

const ytdl = require("ytdl-core");
const fs = require("fs")
const { IgApiClient } = require("instagram-private-api");
const axios = require("axios");
const { TwitterApi } = require("twitter-api-v2");
const { pipeline } = require('stream');
const { promisify } = require('util');
const { v4 } = require("uuid");
const { uploadToS3 } = require("./uploadToS3");

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
      ytdl(url, { quality: 'highest' })
        .pipe(fs.createWriteStream(localFilePath))
        .on('finish', resolve)
        .on('error', reject);
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
      throw new Error("Failed to extract video due to signature extraction issues from YouTube. Please try again later.");
    }
    throw new Error("Error extracting YouTube video");
  }
}

async function extractVideoFromInstagram(url) {
  try {
    const ig = new IgApiClient();
    ig.state.generateDevice("your_instagram_username");

    await ig.account.login(
      "your_instagram_username",
      "your_instagram_password"
    );

    const mediaId = url.split("/")[4];
    const media = await ig.media.info(mediaId);

    const videoUrl = media.items[0].video_versions[0].url;

    const videoBuffer = await downloadVideoFromUrl(videoUrl);
    const fileName = `${Date.now()}.mp4`;

    return {
      videoBuffer,
      fileName,
    };
  } catch (error) {
    console.error("Error extracting Instagram video:", error);
    throw new Error("Error extracting Instagram video");
  }
}

async function extractVideoFromFacebook(url) {
  try {
    const videoId = url.match(/(?:videos\/)(\d+)/);
    if (!videoId || !videoId[1]) {
      throw new Error("Invalid Facebook video URL");
    }

    const accessToken = "your_facebook_access_token";
    const graphUrl = `https://graph.facebook.com/v12.0/${videoId[1]}?fields=source&access_token=${accessToken}`;

    const response = await axios.get(graphUrl);
    const videoUrl = response.data.source;

    const videoBuffer = await downloadVideoFromUrl(videoUrl);
    const fileName = `${Date.now()}.mp4`;

    return {
      videoBuffer,
      fileName,
    };
  } catch (error) {
    console.error("Error extracting Facebook video:", error);
    throw new Error("Error extracting Facebook video");
  }
}

async function extractVideoFromX(url) {
  try {
    const streamPipeline = promisify(pipeline);

    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
    });

    const writer = fs.createWriteStream("/X_video.mp4");
    await streamPipeline(response.data, writer);

    return {
      videoBuffer,
      fileName,
    };
  } catch (error) {
    console.error("Error extracting X (Twitter) video:", error);
    throw new Error("Error extracting X (Twitter) video");
  }
}

async function downloadVideoFromUrl(videoUrl) {
  try {
    const response = await axios({
      method: "get",
      url: videoUrl,
      responseType: "arraybuffer",
    });

    return Buffer.from(response.data);
  } catch (error) {
    console.error("Error downloading video from URL:", error);
    throw new Error("Error downloading video from URL");
  }
}

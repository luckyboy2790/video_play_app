process.env.YTDL_NO_UPDATE = "true";

const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("./s3-credentials");

const ytdl = require("ytdl-core");
const { IgApiClient } = require("instagram-private-api");
const axios = require("axios");
const { TwitterApi } = require("twitter-api-v2");

exports.uploadToS3 = async (file, fileName) => {
  try {
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: `${fileName}`,
      Body: file,
      ContentType: "video/mp4",
    };

    const command = new PutObjectCommand(params);

    const data = await s3Client.send(command);

    console.log(data.$metadata.httpStatusCode);

    if (data.$metadata.httpStatusCode !== 200) {
      return;
    }

    let url = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_DEFAULT_REGION}.amazonaws.com/${params.Key}`;

    console.log(url);

    return { url, key: params.Key };
  } catch (err) {
    console.error(err);
  }
};

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

function isValidYouTubeUrl(url) {
  const regex = /^(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=|https?:\/\/(?:www\.)?youtu\.be\/)[a-zA-Z0-9_-]+$/;
  return regex.test(url);
}

async function extractVideoFromYouTube(url) {
  try {
    if (!isValidYouTubeUrl(url)) {
      throw new Error("Invalid YouTube URL");
    }

    const videoStream = ytdl(url, { quality: "highest" });
    const fileName = `${Date.now()}.mp4`;

    const videoBuffer = await streamToBuffer(videoStream);

    return {
      videoBuffer,
      fileName,
    };
  } catch (error) {
    console.error("Error extracting YouTube video:", error);
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
    const twitterClient = new TwitterApi({
      appKey: "your_twitter_app_key",
      appSecret: "your_twitter_app_secret",
      accessToken: "your_twitter_access_token",
      accessSecret: "your_twitter_access_secret",
    });

    const tweetId = url.split("/status/")[1];
    if (!tweetId) {
      throw new Error("Invalid X (Twitter) video URL");
    }

    const tweet = await twitterClient.v2.singleTweet(tweetId);

    const videoUrl = tweet.data.attachments.media_keys
      ? tweet.includes.media[tweet.data.attachments.media_keys[0]].url
      : null;

    if (!videoUrl) {
      throw new Error("No video found in this tweet");
    }

    const videoBuffer = await downloadVideoFromUrl(videoUrl);
    const fileName = `${Date.now()}.mp4`;

    return {
      videoBuffer,
      fileName,
    };
  } catch (error) {
    console.error("Error extracting X (Twitter) video:", error);
    throw new Error("Error extracting X (Twitter) video");
  }
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
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

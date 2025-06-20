const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("./s3-credentials");

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
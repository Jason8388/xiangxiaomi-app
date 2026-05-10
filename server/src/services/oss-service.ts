/**
 * 阿里云OSS存储服务
 * 使用S3Storage SDK实现文件上传和访问URL生成
 */

import { S3Storage } from "coze-coding-dev-sdk";

// 初始化OSS存储客户端
// 凭证从环境变量读取
const storage = new S3Storage({
  endpointUrl: process.env.OSS_ENDPOINT,
  accessKey: process.env.OSS_ACCESS_KEY_ID,
  secretKey: process.env.OSS_ACCESS_KEY_SECRET,
  bucketName: process.env.OSS_BUCKET,
  region: process.env.OSS_REGION,
});

/**
 * 上传文件到OSS
 */
export async function uploadToOSS(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const key = `uploads/${Date.now()}-${filename}`;
  const url = await storage.upload(buffer, key, contentType);
  return url;
}

/**
 * 生成带签名的访问URL
 */
export async function getSignedUrl(key: string): Promise<string> {
  return await storage.getSignedUrl(key);
}

/**
 * 上传文件到OSS并返回URL和key（兼容接口）
 */
export async function uploadAndGetUrl(
  file: Buffer,
  filename: string,
  folder: string = "uploads"
): Promise<{ url: string; key: string }> {
  const ext = filename.split(".").pop() || "";
  const key = `${folder}/${Date.now()}-${filename}`;
  const url = await storage.upload(file, key, "application/octet-stream");
  return { url, key };
}

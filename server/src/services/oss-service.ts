/**
 * 阿里云OSS存储服务
 * 使用S3Storage SDK实现文件上传和访问URL生成
 * 当OSS未配置时，使用本地文件存储作为后备方案
 */

import { S3Storage } from "coze-coding-dev-sdk";
import fs from 'fs';
import path from 'path';

// 检查OSS配置是否完整
function isOSSConfigured(): boolean {
  return !!(
    process.env.OSS_ENDPOINT &&
    process.env.OSS_ACCESS_KEY_ID &&
    process.env.OSS_ACCESS_KEY_SECRET &&
    process.env.OSS_BUCKET
  );
}

// 初始化OSS存储客户端
// 凭证从环境变量读取
let storage: S3Storage | null = null;

function getOSSStorage(): S3Storage | null {
  if (!isOSSConfigured()) {
    console.warn('[OSS] OSS配置不完整，请检查环境变量: OSS_ENDPOINT, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET');
    console.warn('[OSS] 当前配置:', {
      OSS_ENDPOINT: process.env.OSS_ENDPOINT || '(未设置)',
      OSS_ACCESS_KEY_ID: process.env.OSS_ACCESS_KEY_ID ? '(已设置)' : '(未设置)',
      OSS_ACCESS_KEY_SECRET: process.env.OSS_ACCESS_KEY_SECRET ? '(已设置)' : '(未设置)',
      OSS_BUCKET: process.env.OSS_BUCKET || '(未设置)',
    });
    return null;
  }

  if (!storage) {
    storage = new S3Storage({
      endpointUrl: process.env.OSS_ENDPOINT,
      accessKey: process.env.OSS_ACCESS_KEY_ID,
      secretKey: process.env.OSS_ACCESS_KEY_SECRET,
      bucketName: process.env.OSS_BUCKET,
      region: process.env.OSS_REGION,
    });
  }
  return storage;
}

// 本地文件存储配置
// 本地存储路径：保存到 client/dist/assets/uploads/
// 这样 Express 服务器可以直接提供服务
// __dirname = server/dist/services/
// clientDistPath = ../../client/dist
const CLIENT_DIST_PATH = path.resolve(__dirname, '../../client/dist');
const LOCAL_UPLOAD_DIR = path.join(CLIENT_DIST_PATH, 'assets/uploads');

// 确保本地上传目录存在
function ensureLocalUploadDir(): string {
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
  return LOCAL_UPLOAD_DIR;
}

/**
 * 上传文件到本地存储（后备方案）
 */
async function uploadToLocalStorage(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<{ url: string; key: string; localPath: string }> {
  const uploadDir = ensureLocalUploadDir();
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const ext = filename.split(".").pop() || "";
  const key = `${timestamp}_${randomStr}${ext ? "." + ext : ""}`;
  const localPath = path.join(uploadDir, key);
  
  // 保存文件
  fs.writeFileSync(localPath, buffer);
  
  // 生成可访问的URL（通过 Express 服务器的静态文件服务访问）
  // Express 托管 client/dist/ 目录，所以 URL 格式为 /assets/uploads/xxx
  const url = `/assets/uploads/${encodeURIComponent(key)}`;
  
  console.log('[LocalStorage] 文件已保存到:', localPath);
  console.log('[LocalStorage] 访问URL:', url);
  
  return { url, key, localPath };
}

/**
 * 上传文件到OSS
 */
export async function uploadToOSS(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const oss = getOSSStorage();
  if (!oss) {
    throw new Error('OSS未正确配置，无法上传文件');
  }
  const url = await oss.uploadFile({
    fileContent: buffer,
    fileName: `uploads/${Date.now()}-${filename}`,
    contentType: contentType,
  });
  return url;
}

/**
 * 生成带签名的访问URL
 */
export async function getSignedUrl(key: string): Promise<string> {
  const oss = getOSSStorage();
  if (!oss) {
    throw new Error('OSS未正确配置，无法生成签名URL');
  }
  return await oss.generatePresignedUrl({ key });
}

/**
 * 上传文件到OSS并返回URL和key（兼容接口）
 * 当OSS未配置时，自动使用本地存储
 */
export async function uploadAndGetUrl(
  file: Buffer,
  filename: string,
  folder: string = "uploads"
): Promise<{ url: string; key: string }> {
  // 优先使用OSS
  if (isOSSConfigured()) {
    const oss = getOSSStorage()!;
    const key = `${folder}/${Date.now()}-${filename}`;
    const url = await oss.uploadFile({
      fileContent: file,
      fileName: key,
      contentType: "application/octet-stream",
    });
    console.log('[OSS] 文件上传成功:', url);
    return { url, key };
  }
  
  // OSS未配置时，使用本地存储
  console.log('[OSS] OSS未配置，使用本地存储作为后备方案');
  const result = await uploadToLocalStorage(file, filename, "application/octet-stream");
  return { url: result.url, key: result.key };
}

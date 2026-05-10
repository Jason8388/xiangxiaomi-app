/**
 * 阿里云OSS/Supabase Storage存储服务
 * 使用S3Storage SDK实现文件上传和访问URL生成
 * 当OSS未配置时，尝试使用Supabase Storage
 */

import { S3Storage } from "coze-coding-dev-sdk";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
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

// 检查Supabase配置是否可用
function isSupabaseConfigured(): boolean {
  return !!(
    process.env.COZE_SUPABASE_URL &&
    process.env.COZE_SUPABASE_ANON_KEY
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

// Supabase Storage 客户端
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    console.warn('[OSS] Supabase配置不可用，请检查环境变量: COZE_SUPABASE_URL, COZE_SUPABASE_ANON_KEY');
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.COZE_SUPABASE_URL!,
      process.env.COZE_SUPABASE_ANON_KEY!
    );
  }
  return supabaseClient;
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
 * 上传文件到Supabase Storage
 */
async function uploadToSupabase(
  buffer: Buffer,
  filename: string,
  bucket: string = "uploads"
): Promise<{ url: string; key: string }> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase未正确配置，无法上传文件');
  }
  
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 10);
  const ext = filename.split(".").pop() || "";
  const key = `${bucket}/${timestamp}_${randomStr}${ext ? "." + ext : ""}`;
  
  const { data, error } = await client.storage
    .from(bucket)
    .upload(key, buffer, {
      contentType: "application/octet-stream",
      upsert: true,
    });

  if (error) {
    console.error('[Supabase] 上传失败:', error);
    throw new Error(`Supabase上传失败: ${error.message}`);
  }

  // 获取公开访问URL
  const { data: urlData } = client.storage.from(bucket).getPublicUrl(key);
  console.log('[Supabase] 文件上传成功:', urlData.publicUrl);
  return { url: urlData.publicUrl, key };
}

/**
 * 上传文件到OSS并返回URL和key（兼容接口）
 * 优先级：OSS > Supabase > 本地存储
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
  
  // OSS未配置时，尝试使用Supabase Storage
  if (isSupabaseConfigured()) {
    try {
      console.log('[OSS] OSS未配置，尝试使用Supabase Storage...');
      return await uploadToSupabase(file, filename, folder);
    } catch (supabaseError) {
      console.error('[OSS] Supabase上传失败:', supabaseError);
      // 继续使用本地存储作为最后的方案
    }
  }
  
  // 最后使用本地存储（容器重启后会丢失，这是临时方案）
  console.log('[OSS] Supabase也不可用，使用本地存储作为最后方案');
  const result = await uploadToLocalStorage(file, filename, "application/octet-stream");
  return { url: result.url, key: result.key };
}

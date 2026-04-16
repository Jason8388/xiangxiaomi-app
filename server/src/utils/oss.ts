import OSS from 'ali-oss';

/**
 * OSS 配置接口
 */
interface OSSConfig {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
}

/**
 * 初始化 OSS 客户端
 */
let ossClient: OSS | null = null;

function getOSSConfig(): OSSConfig {
  return {
    region: process.env.OSS_REGION || '',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    bucket: process.env.OSS_BUCKET || '',
  };
}

/**
 * 获取 OSS 客户端实例（单例模式）
 */
export function getOSSClient(): OSS {
  if (!ossClient) {
    const config = getOSSConfig();

    // 验证配置
    if (!config.region || !config.accessKeyId || !config.accessKeySecret || !config.bucket) {
      throw new Error('OSS 配置不完整，请检查环境变量');
    }

    ossClient = new OSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket,
      secure: true, // 使用 HTTPS
    });
  }

  return ossClient;
}

/**
 * 上传文件到 OSS
 * @param fileBuffer 文件 Buffer
 * @param fileName 文件名
 * @param contentType 文件类型
 * @returns 文件的公网访问 URL
 */
export async function uploadFileToOSS(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  try {
    const client = getOSSClient();

    // 生成唯一的文件名（防止覆盖）
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const objectName = `uploads/${timestamp}-${randomStr}-${fileName}`;

    // 上传文件
    const result = await client.put(objectName, fileBuffer, {
      headers: {
        'Content-Type': contentType,
      },
    });

    // 返回文件的公网访问 URL
    return result.url;
  } catch (error) {
    console.error('OSS 上传失败:', error);
    throw new Error('文件上传到 OSS 失败');
  }
}

/**
 * 删除 OSS 文件
 * @param fileUrl 文件 URL
 */
export async function deleteFileFromOSS(fileUrl: string): Promise<void> {
  try {
    const client = getOSSClient();

    // 从 URL 中提取 objectName
    const url = new URL(fileUrl);
    const objectName = url.pathname.substring(1); // 移除开头的 /

    await client.delete(objectName);
  } catch (error) {
    console.error('OSS 删除失败:', error);
    throw new Error('从 OSS 删除文件失败');
  }
}

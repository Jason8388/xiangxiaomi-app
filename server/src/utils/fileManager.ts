import { S3Storage } from 'coze-coding-dev-sdk';

// 初始化 S3Storage
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

/**
 * 文件管理工具类
 * 用于处理对象存储相关的操作
 */
export class FileManager {
  /**
   * 生成文件访问 URL
   * @param fileKey - 文件 key
   * @param expireTime - 过期时间（秒），默认 1 天
   * @returns 签名 URL
   */
  static async getFileUrl(fileKey: string, expireTime: number = 86400): Promise<string> {
    try {
      const url = await storage.generatePresignedUrl({
        key: fileKey,
        expireTime,
      });
      return url;
    } catch (error: any) {
      console.error('[FileManager] 获取文件 URL 失败:', error);
      throw new Error('获取文件 URL 失败');
    }
  }

  /**
   * 批量生成文件访问 URL
   * @param fileKeys - 文件 key 数组
   * @param expireTime - 过期时间（秒），默认 1 天
   * @returns 签名 URL 数组
   */
  static async getFileUrls(
    fileKeys: string[],
    expireTime: number = 86400
  ): Promise<string[]> {
    try {
      const promises = fileKeys.map(key =>
        this.getFileUrl(key, expireTime)
      );
      return await Promise.all(promises);
    } catch (error: any) {
      console.error('[FileManager] 批量获取文件 URL 失败:', error);
      throw new Error('批量获取文件 URL 失败');
    }
  }

  /**
   * 上传文件到对象存储
   * @param fileContent - 文件内容（Buffer）
   * @param fileName - 文件名
   * @param contentType - MIME 类型
   * @param folder - 文件夹路径
   * @returns 文件 key
   */
  static async uploadFile(
    fileContent: Buffer,
    fileName: string,
    contentType: string,
    folder: string = 'uploads'
  ): Promise<string> {
    try {
      // 构建文件名，添加时间戳防止重名
      const timestamp = Date.now();
      const finalFileName = `${folder}/${timestamp}_${fileName}`;

      const fileKey = await storage.uploadFile({
        fileContent,
        fileName: finalFileName,
        contentType,
      });

      console.log('[FileManager] 文件上传成功:', finalFileName);
      return fileKey;
    } catch (error: any) {
      console.error('[FileManager] 文件上传失败:', error);
      throw new Error('文件上传失败');
    }
  }

  /**
   * 删除文件
   * @param fileKey - 文件 key
   * @returns 是否删除成功
   */
  static async deleteFile(fileKey: string): Promise<boolean> {
    try {
      const success = await storage.deleteFile({ fileKey });
      console.log('[FileManager] 文件删除成功:', fileKey);
      return success;
    } catch (error: any) {
      console.error('[FileManager] 文件删除失败:', error);
      return false;
    }
  }

  /**
   * 批量删除文件
   * @param fileKeys - 文件 key 数组
   * @returns 删除成功的文件 key 数组
   */
  static async deleteFiles(fileKeys: string[]): Promise<string[]> {
    const results: string[] = [];
    for (const key of fileKeys) {
      const success = await this.deleteFile(key);
      if (success) {
        results.push(key);
      }
    }
    return results;
  }

  /**
   * 从附件数组中提取文件 key
   * @param attachments - 附件数组（可能是 key 数组或包含 key 的对象数组）
   * @returns 文件 key 数组
   */
  static extractFileKeys(attachments: any[]): string[] {
    if (!Array.isArray(attachments)) {
      return [];
    }

    return attachments
      .map(attachment => {
        // 如果是字符串，直接作为 key
        if (typeof attachment === 'string') {
          return attachment;
        }
        // 如果是对象，尝试获取 key 属性
        if (typeof attachment === 'object' && attachment !== null) {
          return attachment.key || attachment.fileKey || attachment.url;
        }
        return null;
      })
      .filter(key => key !== null) as string[];
  }

  /**
   * 为附件数组添加 URL
   * @param attachments - 附件数组（key 数组）
   * @param expireTime - URL 过期时间
   * @returns 包含 URL 的附件数组
   */
  static async enrichAttachmentsWithUrls(
    attachments: string[],
    expireTime: number = 86400
  ): Promise<Array<{ key: string; url: string }>> {
    if (!Array.isArray(attachments) || attachments.length === 0) {
      return [];
    }

    const urls = await this.getFileUrls(attachments, expireTime);

    return attachments.map((key, index) => ({
      key,
      url: urls[index],
    }));
  }
}

export default FileManager;

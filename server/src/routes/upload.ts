/**
 * 文件上传API路由
 * 使用阿里云OSS存储文件
 */

import express from "express";
import multer from "multer";
import { uploadAndGetUrl } from "../services/oss-service";

const router = express.Router();

// 配置 multer 内存存储
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 限制50MB
  },
});

/**
 * POST /api/v1/upload
 * 上传文件到阿里云OSS
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "没有上传文件" });
    }

    const { originalname, buffer, mimetype } = req.file;

    console.log("[Upload] 准备上传文件:", originalname, "大小:", buffer.length, "类型:", mimetype);

    // 上传到OSS并获取URL
    const result = await uploadAndGetUrl(buffer, originalname, mimetype);

    console.log("[Upload] 文件上传成功:", result.url);

    res.json({
      success: true,
      url: result.url,
      filename: result.filename,
      originalname: originalname,
      size: buffer.length,
      mimetype: mimetype,
    });
  } catch (error) {
    console.error("[Upload] 上传失败:", error);
    res.status(500).json({ error: "上传失败", details: String(error) });
  }
});

/**
 * GET /api/v1/upload/presigned-url
 * 获取预签名上传URL（用于前端直接上传到OSS）
 */
router.get("/presigned-url", async (req, res) => {
  try {
    const { filename, contentType } = req.query;

    if (!filename || !contentType) {
      return res.status(400).json({ error: "缺少filename或contentType参数" });
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const ext = String(filename).split(".").pop() || "";
    const ossFilename = `${timestamp}_${randomStr}${ext ? "." + ext : ""}`;

    res.json({
      success: true,
      filename: ossFilename,
      presignedUrl: `http://xiangxiaomi.oss-cn-hangzhou.aliyuncs.com`,
      // 前端需要使用这个key进行上传
      uploadKey: ossFilename,
    });
  } catch (error) {
    console.error("[Upload] 获取预签名URL失败:", error);
    res.status(500).json({ error: "获取预签名URL失败", details: String(error) });
  }
});

export default router;

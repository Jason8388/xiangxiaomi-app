import express from 'express';
import { memoryFiles } from './files';

const router = express.Router();

// 通用查询接口
router.get('/search', async (req, res) => {
  try {
    const { type, keyword } = req.query;
    res.status(200).json({
      code: 0,
      data: [],
      message: 'success'
    });
  } catch (error) {
    console.error('Query search error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 合同查询
router.get('/contracts', async (req, res) => {
  try {
    res.status(200).json({
      code: 0,
      data: [],
      message: 'success'
    });
  } catch (error) {
    console.error('Query contracts error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 设备查询
router.get('/devices', async (req, res) => {
  try {
    res.status(200).json({
      code: 0,
      data: [],
      message: 'success'
    });
  } catch (error) {
    console.error('Query devices error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 物料查询
router.get('/materials', async (req, res) => {
  try {
    res.status(200).json({
      code: 0,
      data: [],
      message: 'success'
    });
  } catch (error) {
    console.error('Query materials error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 会议查询
router.get('/meetings', async (req, res) => {
  try {
    res.status(200).json({
      code: 0,
      data: [],
      message: 'success'
    });
  } catch (error) {
    console.error('Query meetings error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

// 文件查询
router.get('/files', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || typeof keyword !== 'string') {
      return res.status(200).json({
        code: 0,
        data: [],
        message: 'success'
      });
    }

    // 从内存存储中搜索文件
    const keywordLower = keyword.toLowerCase();
    const filteredFiles = memoryFiles
      .filter((file) => {
        // 搜索文件名
        const fileName = (file.file_name || '').toLowerCase();
        // 搜索分类
        const category = (file.category || '').toLowerCase();
        // 搜索描述
        const description = (file.description || '').toLowerCase();
        // 搜索标签
        const tags = (file.tags || []).map((t: string) => t.toLowerCase()).join(' ');

        return (
          fileName.includes(keywordLower) ||
          category.includes(keywordLower) ||
          description.includes(keywordLower) ||
          tags.includes(keywordLower)
        );
      })
      .map((file) => ({
        id: file.id,
        file_name: file.file_name,
        file_url: file.file_url || '',
        file_type: file.file_type,
        file_size: file.file_size,
        uploaded_by: file.uploaded_by === 1 ? 'admin' : `用户${file.uploaded_by}`,
        tags: file.tags || [],
        created_at: file.created_at,
        customer_name: file.customer_name || null,
        project_name: file.project_name || null,
        device_name: file.device_name || null,
        device_number: file.device_number || null,
      }));

    res.status(200).json(filteredFiles);
  } catch (error) {
    console.error('Query files error:', error);
    res.status(500).json({ code: 1, message: 'Internal server error' });
  }
});

export default router;

import express from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import pool, { USE_DATABASE } from '../database/db';
import { uploadFileToOSS } from '../utils/oss';

const router = express.Router();

// 配置文件上传 - 支持图片和文档
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 限制50MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = [
      // 图片
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      // Word文档
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Excel表格
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // PowerPoint
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // PDF
      'application/pdf',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 内存数据存储（用于数据库不可用时）
const memoryKnowledgeList: any[] = [
  {
    id: 1,
    title: '设备日常维护指南',
    category: '维护手册',
    content: '本指南详细介绍了设备的日常维护流程、注意事项和常见故障排查方法。',
    author: '张工',
    author_name: '张工',
    author_id: 1,
    created_at: '2024-01-15 09:30:00',
    updated_at: '2024-01-20 14:25:00',
    views: 125,
    tags: ['维护', '设备'],
    files: []
  },
  {
    id: 2,
    title: '安全操作规范',
    category: '安全管理',
    content: '详细的安全操作流程和紧急情况处理方法。',
    author: '李主管',
    author_name: '李主管',
    author_id: 2,
    created_at: '2024-01-10 10:00:00',
    updated_at: '2024-01-18 16:40:00',
    views: 200,
    tags: ['安全', '规范'],
    files: []
  }
];

// 数据库查询重试函数
async function queryWithRetry(sql: string, params: any[] = [], retries = 3) {
  if (!USE_DATABASE || !pool) {
    throw new Error('Database not available');
  }
  
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query(sql, params);
        return result;
      } finally {
        client.release();
      }
    } catch (err: any) {
      if (err.code === '57P01' && i < retries - 1) {
        // 数据库启动中，等待重试
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries reached');
}

// ==================== 静态路由（必须在动态路由之前） ====================

// 下载知识库导入模板
router.get('/template', async (req, res) => {
  try {
    // 创建模板数据
    const templateData = [
      {
        '标题*': '示例：设备维护指南',
        '分类*': '维护手册',
        '内容*': '详细描述设备维护的步骤和注意事项',
        '标签': '维护,设备,安全',
        '作者': '张工',
        '备注': '可选字段'
      },
      {
        '标题*': '示例：安全操作规范',
        '分类*': '安全管理',
        '内容*': '详细说明安全操作的流程和注意事项',
        '标签': '安全,规范',
        '作者': '李主管',
        '备注': '重要文档'
      }
    ];

    // 创建工作簿
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '知识库导入模板');

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 30 }, // 标题
      { wch: 15 }, // 分类
      { wch: 50 }, // 内容
      { wch: 20 }, // 标签
      { wch: 15 }, // 作者
      { wch: 20 }, // 备注
    ];

    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const fileName = encodeURIComponent('知识库导入模板.xlsx');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${fileName}`);
    res.setHeader('Content-Length', excelBuffer.length);

    // 发送文件
    res.send(excelBuffer);
  } catch (error) {
    console.error('Download template error:', error);
    res.status(500).json({ code: 1, message: '下载模板失败' });
  }
});

// 批量导入知识库
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ code: 1, message: '请上传Excel文件' });
    }

    const file = req.file;
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return res.status(400).json({ code: 1, message: 'Excel文件为空' });
    }

    // 验证和处理数据
    const validItems: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowIndex = i + 2; // Excel行号（从1开始，标题在第1行）

      // 验证必填字段
      if (!row['标题*'] && !row['标题']) {
        errors.push(`第${rowIndex}行：标题不能为空`);
        continue;
      }

      if (!row['分类*'] && !row['分类']) {
        errors.push(`第${rowIndex}行：分类不能为空`);
        continue;
      }

      if (!row['内容*'] && !row['内容']) {
        errors.push(`第${rowIndex}行：内容不能为空`);
        continue;
      }

      validItems.push({
        title: row['标题*'] || row['标题'] || '',
        category: row['分类*'] || row['分类'] || '',
        content: row['内容*'] || row['内容'] || '',
        tags: (row['标签'] || '').split(',').map((t: string) => t.trim()).filter((t: string) => t),
        author: row['作者'] || '未知',
        author_id: 1, // 默认作者ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        views: 0,
        files: []
      });
    }

    if (validItems.length === 0) {
      return res.status(400).json({ code: 1, message: '没有有效的数据行', errors });
    }

    // 保存到数据库
    let importedCount = 0;
    try {
      for (const item of validItems) {
        await queryWithRetry(
          'INSERT INTO knowledge (title, category, content, author, author_id, created_at, updated_at, views, tags) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [item.title, item.category, item.content, item.author, item.author_id, item.created_at, item.updated_at, item.views, JSON.stringify(item.tags)]
        );
        importedCount++;
      }
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      // 保存到内存存储
      for (const item of validItems) {
        item.id = memoryKnowledgeList.length + 1;
        memoryKnowledgeList.push(item);
        importedCount++;
      }
    }

    res.json({
      code: 0,
      message: `成功导入${importedCount}条数据`,
      data: {
        imported: importedCount,
        total: data.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Import knowledge error:', error);
    res.status(500).json({ code: 1, message: '导入失败' });
  }
});

// 批量导出知识库
router.get('/export', async (req, res) => {
  try {
    let knowledgeList: any[] = [];

    try {
      // 从数据库获取数据
      const result = await queryWithRetry(
        'SELECT k.*, u.name as author_name FROM knowledge k LEFT JOIN users u ON k.author_id = u.id ORDER BY k.id DESC LIMIT 1000'
      );
      knowledgeList = result.rows;
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      knowledgeList = memoryKnowledgeList;
    }

    if (!knowledgeList || knowledgeList.length === 0) {
      return res.status(404).json({ code: 1, message: '没有可导出的数据' });
    }

    // 转换数据格式
    const exportData = knowledgeList.map(item => ({
      ID: item.id,
      标题: item.title,
      分类: item.category,
      内容: item.content,
      作者: item.author_name || item.author || '未知',
      标签: Array.isArray(item.tags) ? item.tags.join(',') : item.tags || '',
      创建时间: item.created_at,
      更新时间: item.updated_at,
      浏览次数: item.views || 0
    }));

    // 创建工作簿
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '知识库数据');

    // 设置列宽
    worksheet['!cols'] = [
      { wch: 10 }, // ID
      { wch: 30 }, // 标题
      { wch: 15 }, // 分类
      { wch: 50 }, // 内容
      { wch: 15 }, // 作者
      { wch: 20 }, // 标签
      { wch: 20 }, // 创建时间
      { wch: 20 }, // 更新时间
      { wch: 10 }, // 浏览次数
    ];

    // 生成Excel文件
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 设置响应头
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const fileName = encodeURIComponent(`知识库数据导出_${new Date().toISOString().split('T')[0]}.xlsx`);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${fileName}`);
    res.setHeader('Content-Length', excelBuffer.length);

    // 发送文件
    res.send(excelBuffer);
  } catch (error) {
    console.error('Export knowledge error:', error);
    res.status(500).json({ code: 1, message: '导出失败' });
  }
});

// 搜索知识库
router.get('/search/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    try {
      const result = await queryWithRetry(
        "SELECT k.*, u.name as author_name FROM knowledge k LEFT JOIN users u ON k.author_id = u.id WHERE k.title ILIKE $1 OR k.content ILIKE $1 ORDER BY k.id DESC",
        [`%${keyword}%`]
      );
      res.json(result.rows);
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      const kw = keyword.toLowerCase();
      const filtered = memoryKnowledgeList.filter(k => 
        k.title?.toLowerCase().includes(kw) || 
        k.content?.toLowerCase().includes(kw)
      );
      res.json(filtered);
    }
  } catch (error) {
    console.error('Search knowledge error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// ==================== 动态路由（必须在静态路由之后） ====================

// 获取知识库列表
router.get('/', async (req, res) => {
  try {
    try {
      const result = await queryWithRetry(
        'SELECT k.*, u.name as author_name FROM knowledge k LEFT JOIN users u ON k.author_id = u.id ORDER BY k.id DESC LIMIT 100'
      );
      res.json({ code: 0, data: result.rows, message: 'success' });
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      res.json({ code: 0, data: memoryKnowledgeList.slice(0, 100), message: 'success' });
    }
  } catch (error) {
    console.error('Get knowledge error:', error);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

// 获取知识库详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    try {
      // 增加浏览次数
      await queryWithRetry('UPDATE knowledge SET views = views + 1 WHERE id = $1', [id]);

      const result = await queryWithRetry(
        'SELECT k.*, u.name as author_name FROM knowledge k LEFT JOIN users u ON k.author_id = u.id WHERE k.id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        // 尝试从内存中获取
        const memoryItem = memoryKnowledgeList.find(k => k.id === parseInt(id));
        if (memoryItem) {
          return res.json(memoryItem);
        }
        return res.status(404).json({ error: '知识不存在' });
      }

      const knowledge = result.rows[0];
      // 如果 author_name 为空，使用默认值
      if (!knowledge.author_name) {
        knowledge.author_name = '未知用户';
      }
      // 添加 author 字段用于前端兼容
      knowledge.author = knowledge.author_name;
      knowledge.author_name = knowledge.author_name;

      res.json(knowledge);
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      const memoryItem = memoryKnowledgeList.find(k => k.id === parseInt(id));
      if (memoryItem) {
        return res.json(memoryItem);
      }
      res.status(404).json({ error: '知识不存在' });
    }
  } catch (error) {
    console.error('Get knowledge detail error:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 创建知识库（支持文件上传）
router.post('/', upload.array('files', 10), async (req, res) => {
  try {
    const { title, content, tags, author_id, creator } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!title) {
      return res.status(400).json({ code: 1, message: '标题不能为空' });
    }

    // 上传文件到OSS并获取URL
    let fileUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const fileName = `${Date.now()}_${file.originalname}`;
          const url = await uploadFileToOSS(file.buffer, fileName);
          fileUrls.push(url);
        } catch (uploadError) {
          console.error('Upload file error:', uploadError);
        }
      }
    }

    // 保存到数据库
    try {
      const result = await queryWithRetry(
        'INSERT INTO knowledge (title, category, content, author_id, created_at, updated_at, files, tags) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
        [
          title,
          '知识库',
          content || '',
          author_id || 1,
          new Date().toISOString(),
          new Date().toISOString(),
          JSON.stringify(fileUrls),
          tags ? JSON.stringify(tags) : '[]'
        ]
      );

      // 获取作者名称
      const knowledge = result.rows[0];
      try {
        const userResult = await queryWithRetry('SELECT name FROM users WHERE id = $1', [author_id || 1]);
        knowledge.author_name = userResult.rows[0]?.name || '未知用户';
        knowledge.author = knowledge.author_name;
      } catch {
        knowledge.author_name = '未知用户';
        knowledge.author = knowledge.author_name;
      }

      res.status(201).json({ code: 0, data: knowledge, message: '创建成功' });
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      // 保存到内存存储
      const newKnowledge = {
        id: memoryKnowledgeList.length + 1,
        title,
        category: '知识库',
        content: content || '',
        author_id: author_id || 1,
        author: creator || '未知',
        author_name: creator || '未知',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        views: 0,
        tags: tags || [],
        files: fileUrls
      };
      memoryKnowledgeList.push(newKnowledge);
      res.status(201).json({ code: 0, data: newKnowledge, message: '创建成功' });
    }
  } catch (error) {
    console.error('Create knowledge error:', error);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

// 删除知识库
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    try {
      // 先获取知识信息
      const result = await queryWithRetry(
        'SELECT * FROM knowledge WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        // 尝试从内存中删除
        const index = memoryKnowledgeList.findIndex(k => k.id === parseInt(id));
        if (index > -1) {
          memoryKnowledgeList.splice(index, 1);
          return res.json({ code: 0, message: '删除成功' });
        }
        return res.status(404).json({ code: 1, message: '知识不存在' });
      }

      // 从OSS删除文件
      const knowledge = result.rows[0];
      if (knowledge.files && Array.isArray(knowledge.files)) {
        // TODO: 实现OSS文件删除
      }

      // 从数据库删除
      await queryWithRetry('DELETE FROM knowledge WHERE id = $1', [id]);
      res.json({ code: 0, message: '删除成功' });
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      // 从内存存储删除
      const index = memoryKnowledgeList.findIndex(k => k.id === parseInt(id));
      if (index > -1) {
        memoryKnowledgeList.splice(index, 1);
        return res.json({ code: 0, message: '删除成功' });
      }
      res.status(404).json({ code: 1, message: '知识不存在' });
    }
  } catch (error) {
    console.error('Delete knowledge error:', error);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

// 更新知识库（支持文件上传）
router.put('/:id', upload.array('files', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, category } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!title) {
      return res.status(400).json({ code: 1, message: '标题不能为空' });
    }

    // 上传新文件到OSS并获取URL
    let fileUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const fileName = `${Date.now()}_${file.originalname}`;
          const url = await uploadFileToOSS(file.buffer, fileName);
          fileUrls.push(url);
        } catch (uploadError) {
          console.error('Upload file error:', uploadError);
        }
      }
    }

    try {
      // 获取现有知识
      const existingResult = await queryWithRetry(
        'SELECT * FROM knowledge WHERE id = $1',
        [id]
      );

      if (existingResult.rows.length === 0) {
        return res.status(404).json({ code: 1, message: '知识不存在' });
      }

      const existingKnowledge = existingResult.rows[0];
      // 合并已有文件和新增文件
      const existingFiles = existingKnowledge.files ? JSON.parse(existingKnowledge.files) : [];
      const allFiles = [...existingFiles, ...fileUrls];

      // 更新数据库
      const updateResult = await queryWithRetry(
        'UPDATE knowledge SET title = $1, category = $2, content = $3, tags = $4, files = $5, updated_at = $6 WHERE id = $7 RETURNING *',
        [
          title,
          category || existingKnowledge.category,
          content,
          tags || existingKnowledge.tags,
          JSON.stringify(allFiles),
          new Date().toISOString(),
          id
        ]
      );

      res.json({ code: 0, data: updateResult.rows[0], message: '更新成功' });
    } catch (dbError: any) {
      console.error('Database error:', dbError.message);
      // 更新内存存储
      const index = memoryKnowledgeList.findIndex(k => k.id === parseInt(id));
      if (index > -1) {
        const existingFiles = memoryKnowledgeList[index].files || [];
        memoryKnowledgeList[index] = {
          ...memoryKnowledgeList[index],
          title,
          category: category || memoryKnowledgeList[index].category,
          content,
          tags: tags || memoryKnowledgeList[index].tags,
          files: [...existingFiles, ...fileUrls],
          updated_at: new Date().toISOString()
        };
        res.json({ code: 0, data: memoryKnowledgeList[index], message: '更新成功' });
      } else {
        res.status(404).json({ code: 1, message: '知识不存在' });
      }
    }
  } catch (error) {
    console.error('Update knowledge error:', error);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

// 批量导入知识库
router.post('/batch', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传Excel文件' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ error: 'Excel文件中没有数据' });
    }

    const importedKnowledge: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowNum = i + 2;

      if (!row['标题']) {
        errors.push(`第${rowNum}行：标题不能为空`);
        continue;
      }
      if (!row['内容']) {
        errors.push(`第${rowNum}行：内容不能为空`);
        continue;
      }

      const newKnowledge: any = {
        id: Date.now() + i,
        title: row['标题'] || '',
        category: row['分类'] || '',
        content: row['内容'] || '',
        tags: row['标签'] ? row['标签'].toString().split(',').map((t: string) => t.trim()) : [],
        author_name: row['作者'] || '',
        views: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      importedKnowledge.push(newKnowledge);
    }

    importedKnowledge.forEach((knowledge) => {
      memoryKnowledgeList.unshift(knowledge);
    });

    res.json({
      message: '导入完成',
      total: data.length,
      success: importedKnowledge.length,
      failed: errors.length,
      errors,
      data: importedKnowledge,
    });
  } catch (error) {
    console.error('Import knowledge error:', error);
    res.status(500).json({ error: '导入失败' });
  }
});

export default router;

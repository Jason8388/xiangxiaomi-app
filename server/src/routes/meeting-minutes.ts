import express from "express";
import pool, { USE_DATABASE } from "../database/db";
import { memoryMeetingMinutes as preloadedMinutes } from "../database/memory-storage";
import XLSX from "xlsx";
import multer from "multer";

const router = express.Router();

// 配置multer用于文件上传
const upload = multer({ storage: multer.memoryStorage() });

// 内存数据存储（用于数据库不可用时）- 使用预置数据
const memoryMeetingMinutes: any[] = [...preloadedMinutes];
let memoryMeetingId = preloadedMinutes.length > 0 ? Math.max(...preloadedMinutes.map(m => m.id)) + 1 : 1;

// 带重试的查询函数（快速失败）
async function queryWithRetry(query: string, params: any[] = [], retries = 1, delay = 300) {
  if (!USE_DATABASE) {
    throw new Error('Database not available');
  }
  for (let i = 0; i < retries; i++) {
    try {
      return await pool.query(query, params);
    } catch (error: any) {
      if (i < retries - 1 && (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('timeout') || error.message.includes('terminated'))) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries reached');
}

// Create meeting minute
router.post("/", async (req, res) => {
  try {
    const {
      meeting_name,
      meeting_type,
      meeting_date,
      meeting_location,
      attendees,
      host,
      recorder,
      topics,
      key_points,
      summary,
      file_url,
      customer_id,
      project_id,
      viewable_users,
      tags,
    } = req.body;

    try {
      const result = await queryWithRetry(
        `INSERT INTO meeting_minutes 
         (meeting_name, meeting_type, meeting_date, meeting_location, attendees, host, recorder, topics, key_points, summary, file_url, customer_id, project_id, viewable_users)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id, meeting_name, meeting_date`,
        [
          meeting_name,
          meeting_type || "other",
          meeting_date,
          meeting_location,
          attendees,
          host,
          recorder,
          topics,
          key_points,
          summary,
          file_url,
          customer_id,
          project_id,
          viewable_users,
        ]
      );
      res.status(201).json({ id: result.rows[0].id, message: "会议纪要创建成功" });
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      const newMeeting = {
        id: memoryMeetingId++,
        meeting_name,
        meeting_type: meeting_type || "other",
        meeting_date,
        meeting_location,
        attendees,
        host,
        recorder,
        topics,
        key_points,
        summary,
        file_url,
        customer_id,
        tags: tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryMeetingMinutes.unshift(newMeeting);
      res.status(201).json({ id: newMeeting.id, message: "会议纪要创建成功" });
    }
  } catch (error) {
    console.error("Create meeting minute error:", error);
    res.status(500).json({ message: "创建会议纪要失败" });
  }
});

// Get all meeting minutes with optional keyword search
router.get("/", async (req, res) => {
  try {
    const { keyword, limit } = req.query;
    const limitNum = parseInt(limit as string) || 10;

    try {
      let query = `
        SELECT mm.*, 
               c.name as customer_name,
               (
                 SELECT json_agg(json_build_object('id', mmt.id, 'tag', mmt.tag))
                 FROM meeting_minute_tags mmt
                 WHERE mmt.meeting_minute_id = mm.id
               ) as tags
        FROM meeting_minutes mm
        LEFT JOIN customers c ON mm.customer_id = c.id
      `;

      const params: any[] = [];

      if (keyword) {
        query += ` WHERE mm.meeting_name ILIKE $1 
                   OR mm.meeting_location ILIKE $1 
                   OR mm.attendees ILIKE $1
                   OR mm.topics ILIKE $1
                   OR mm.summary ILIKE $1`;
        params.push(`%${keyword}%`);
      }

      query += " ORDER BY mm.meeting_date DESC, mm.created_at DESC";
      query += ` LIMIT ${limitNum}`;

      const result = await queryWithRetry(query, params);
      res.json(result.rows);
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      // 内存数据搜索
      let filtered = [...memoryMeetingMinutes];
      if (keyword) {
        const kw = (keyword as string).toLowerCase();
        filtered = filtered.filter(m =>
          m.meeting_name?.toLowerCase().includes(kw) ||
          m.meeting_location?.toLowerCase().includes(kw) ||
          m.attendees?.toLowerCase().includes(kw) ||
          m.topics?.toLowerCase().includes(kw) ||
          m.summary?.toLowerCase().includes(kw)
        );
      }
      res.json(filtered.slice(0, limitNum));
    }
  } catch (error) {
    console.error("Get meeting minutes error:", error);
    res.status(500).json({ message: "获取会议纪要列表失败" });
  }
});

// Search meeting minutes (alias endpoint)
router.get("/search", async (req, res) => {
  try {
    const { keyword } = req.query;

    try {
      let query = `
        SELECT mm.*, 
               c.name as customer_name,
               (
                 SELECT json_agg(json_build_object('id', mmt.id, 'tag', mmt.tag))
                 FROM meeting_minute_tags mmt
                 WHERE mmt.meeting_minute_id = mm.id
               ) as tags
        FROM meeting_minutes mm
        LEFT JOIN customers c ON mm.customer_id = c.id
      `;

      const params: any[] = [];

      if (keyword) {
        query += ` WHERE mm.meeting_name ILIKE $1 
                   OR mm.meeting_location ILIKE $1 
                   OR mm.attendees ILIKE $1
                   OR mm.topics ILIKE $1
                   OR mm.summary ILIKE $1`;
        params.push(`%${keyword}%`);
      }

      query += " ORDER BY mm.meeting_date DESC, mm.created_at DESC";

      const result = await queryWithRetry(query, params);
      res.json(result.rows);
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      let filtered = [...memoryMeetingMinutes];
      if (keyword) {
        const kw = (keyword as string).toLowerCase();
        filtered = filtered.filter(m =>
          m.meeting_name?.toLowerCase().includes(kw) ||
          m.meeting_location?.toLowerCase().includes(kw) ||
          m.attendees?.toLowerCase().includes(kw)
        );
      }
      res.json(filtered);
    }
  } catch (error) {
    console.error("Search meeting minutes error:", error);
    res.status(500).json({ message: "搜索会议纪要失败" });
  }
});

// Import meeting minutes template
router.get('/template', async (req, res) => {
  try {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet([
      {
        '会议主题': '',
        '会议类型': '',
        '会议日期': 'YYYY-MM-DD',
        '会议地点': '',
        '参会人员': '',
        '主持人': '',
        '记录人': '',
        '会议议题': '',
        '关键点': '',
        '会议总结': '',
        '客户名称': '',
        '标签': '重要,紧急 (多个标签用逗号分隔)'
      }
    ]);

    XLSX.utils.book_append_sheet(workbook, worksheet, '会议纪要导入模板');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 20 },  // 会议主题
      { wch: 15 },  // 会议类型
      { wch: 15 },  // 会议日期
      { wch: 20 },  // 会议地点
      { wch: 30 },  // 参会人员
      { wch: 15 },  // 主持人
      { wch: 15 },  // 记录人
      { wch: 50 },  // 会议议题
      { wch: 50 },  // 关键点
      { wch: 50 },  // 会议总结
      { wch: 20 },  // 客户名称
      { wch: 40 },  // 标签
    ];

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const encodedFilename = encodeURIComponent('会议纪要导入模板.xlsx');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.send(buffer);
  } catch (error) {
    console.error('Export template error:', error);
    res.status(500).json({ message: '导出模板失败' });
  }
});

// Export meeting minutes to Excel
router.get('/export', async (req, res) => {
  try {
    let meetingMinutes: any[] = [];

    try {
      const result = await queryWithRetry(
        `SELECT mm.*,
                c.name as customer_name,
                (
                  SELECT json_agg(json_build_object('id', mmt.id, 'tag', mmt.tag))
                  FROM meeting_minute_tags mmt
                  WHERE mmt.meeting_minute_id = mm.id
                ) as tags
         FROM meeting_minutes mm
         LEFT JOIN customers c ON mm.customer_id = c.id
         ORDER BY mm.meeting_date DESC`
      );
      meetingMinutes = result.rows;
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      meetingMinutes = memoryMeetingMinutes;
    }

    const exportData = meetingMinutes.map(mm => ({
      'ID': mm.id,
      '会议主题': mm.meeting_name || '',
      '会议类型': mm.meeting_type || '',
      '会议日期': mm.meeting_date || '',
      '会议地点': mm.meeting_location || '',
      '参会人员': mm.attendees || '',
      '主持人': mm.host || '',
      '记录人': mm.recorder || '',
      '会议议题': mm.topics || '',
      '关键点': mm.key_points || '',
      '会议总结': mm.summary || '',
      '客户名称': mm.customer_name || '',
      '标签': Array.isArray(mm.tags) ? mm.tags.map((t: any) => t.tag).join(', ') : '',
      '创建时间': mm.created_at ? new Date(mm.created_at).toLocaleString('zh-CN') : '',
      '更新时间': mm.updated_at ? new Date(mm.updated_at).toLocaleString('zh-CN') : ''
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    XLSX.utils.book_append_sheet(workbook, worksheet, '会议纪要列表');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 8 },   // ID
      { wch: 30 },  // 会议主题
      { wch: 15 },  // 会议类型
      { wch: 15 },  // 会议日期
      { wch: 20 },  // 会议地点
      { wch: 40 },  // 参会人员
      { wch: 15 },  // 主持人
      { wch: 15 },  // 记录人
      { wch: 50 },  // 会议议题
      { wch: 50 },  // 关键点
      { wch: 50 },  // 会议总结
      { wch: 20 },  // 客户名称
      { wch: 40 },  // 标签
      { wch: 20 },  // 创建时间
      { wch: 20 },  // 更新时间
    ];

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const encodedFilename = encodeURIComponent('会议纪要列表.xlsx');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.send(buffer);
  } catch (error) {
    console.error('Export meeting minutes error:', error);
    res.status(500).json({ message: '导出失败' });
  }
});

// Import meeting minutes from Excel
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请上传文件' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const imported = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      try {
        const row: any = data[i];

        // Validate required fields
        if (!row['会议主题'] || !row['会议日期']) {
          errors.push({ row: i + 2, message: '会议主题和会议日期为必填项' });
          continue;
        }

        // Parse tags
        const tags = [];
        if (row['标签']) {
          const tagList = String(row['标签']).split(',').map((t: string) => t.trim()).filter((t: string) => t);
          for (const tag of tagList) {
            if (tag) {
              tags.push(tag);
            }
          }
        }

        const meetingMinute: any = {
          meeting_name: row['会议主题'],
          meeting_date: row['会议日期'],
          meeting_location: row['会议地点'] || '',
          attendees: row['参会人员'] || '',
          topics: row['会议议题'] || '',
          key_points: row['关键点'] || '',
          summary: row['会议总结'] || '',
          customer_id: null,
          created_at: new Date(),
          updated_at: new Date()
        };

        // Try to find customer by name
        if (row['客户名称']) {
          try {
            const customerResult = await queryWithRetry(
              'SELECT id FROM customers WHERE name = $1',
              [row['客户名称']]
            );
            if (customerResult.rows.length > 0) {
              meetingMinute.customer_id = customerResult.rows[0].id;
            }
          } catch (err) {
            console.log('Customer query failed, skipping customer_id');
          }
        }

        let id: number;
        try {
          const insertResult = await queryWithRetry(
            `INSERT INTO meeting_minutes (
              meeting_name, meeting_date, meeting_location, attendees,
              topics, key_points, summary, customer_id,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id`,
            [
              meetingMinute.meeting_name,
              meetingMinute.meeting_date,
              meetingMinute.meeting_location,
              meetingMinute.attendees,
              meetingMinute.topics,
              meetingMinute.key_points,
              meetingMinute.summary,
              meetingMinute.customer_id,
              meetingMinute.created_at,
              meetingMinute.updated_at
            ]
          );
          id = insertResult.rows[0].id;
        } catch (dbError: any) {
          console.log('Database insert failed, using memory storage');
          id = Math.max(0, ...memoryMeetingMinutes.map(m => m.id)) + 1;
          meetingMinute.id = id;
          memoryMeetingMinutes.push(meetingMinute);
        }

        // Insert tags
        for (const tag of tags) {
          try {
            await queryWithRetry(
              'INSERT INTO meeting_minute_tags (meeting_minute_id, tag) VALUES ($1, $2)',
              [id, tag]
            );
          } catch (err) {
            console.log('Tag insert failed, skipping');
          }
        }

        imported.push({ id, meeting_name: meetingMinute.meeting_name });
      } catch (err: any) {
        errors.push({ row: i + 2, message: err.message });
      }
    }

    res.json({
      message: '导入完成',
      total: data.length,
      success: imported.length,
      failed: errors.length,
      imported,
      errors
    });
  } catch (error: any) {
    console.error('Import meeting minutes error:', error);
    res.status(500).json({ message: '导入失败', error: error.message });
  }
});

// Get single meeting minute by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    try {
      const result = await queryWithRetry(
        `SELECT mm.*, 
                c.name as customer_name,
                (
                  SELECT json_agg(json_build_object('id', mmt.id, 'tag', mmt.tag))
                  FROM meeting_minute_tags mmt
                  WHERE mmt.meeting_minute_id = mm.id
                ) as tags
         FROM meeting_minutes mm
         LEFT JOIN customers c ON mm.customer_id = c.id
         WHERE mm.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "会议纪要不存在" });
      }

      res.json(result.rows[0]);
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      const meeting = memoryMeetingMinutes.find(m => m.id === parseInt(id));
      if (meeting) {
        res.json(meeting);
      } else {
        res.status(404).json({ message: "会议纪要不存在" });
      }
    }
  } catch (error) {
    console.error("Get meeting minute error:", error);
    res.status(500).json({ message: "获取会议纪要详情失败" });
  }
});

// Update meeting minute
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      meeting_name,
      meeting_type,
      meeting_date,
      meeting_location,
      attendees,
      host,
      recorder,
      topics,
      key_points,
      summary,
      file_url,
      customer_id,
      project_id,
      viewable_users,
      tags,
    } = req.body;

    try {
      const result = await queryWithRetry(
        `UPDATE meeting_minutes 
         SET meeting_name = $1, meeting_type = $2, meeting_date = $3, meeting_location = $4,
             attendees = $5, host = $6, recorder = $7, topics = $8, key_points = $9,
             summary = $10, file_url = $11, customer_id = $12, project_id = $13, 
             viewable_users = $14, updated_at = CURRENT_TIMESTAMP
         WHERE id = $15
         RETURNING id`,
        [
          meeting_name,
          meeting_type,
          meeting_date,
          meeting_location,
          attendees,
          host,
          recorder,
          topics,
          key_points,
          summary,
          file_url,
          customer_id,
          project_id,
          viewable_users,
          id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "会议纪要不存在" });
      }

      // Update tags
      await queryWithRetry("DELETE FROM meeting_minute_tags WHERE meeting_minute_id = $1", [id]);

      if (tags && Array.isArray(tags) && tags.length > 0) {
        for (const tag of tags.slice(0, 10)) {
          await queryWithRetry(
            "INSERT INTO meeting_minute_tags (meeting_minute_id, tag) VALUES ($1, $2)",
            [id, tag]
          );
        }
      }

      res.json({ id: parseInt(id), message: "会议纪要更新成功" });
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      const index = memoryMeetingMinutes.findIndex(m => m.id === parseInt(id));
      if (index === -1) {
        return res.status(404).json({ message: "会议纪要不存在" });
      }
      memoryMeetingMinutes[index] = {
        ...memoryMeetingMinutes[index],
        meeting_name,
        meeting_type,
        meeting_date,
        meeting_location,
        attendees,
        host,
        recorder,
        topics,
        key_points,
        summary,
        file_url,
        customer_id,
        tags: tags || [],
        updated_at: new Date().toISOString(),
      };
      res.json({ id: parseInt(id), message: "会议纪要更新成功" });
    }
  } catch (error) {
    console.error("Update meeting minute error:", error);
    res.status(500).json({ message: "更新会议纪要失败" });
  }
});

// Delete meeting minute
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    try {
      // Delete tags first
      await queryWithRetry("DELETE FROM meeting_minute_tags WHERE meeting_minute_id = $1", [id]);

      const result = await queryWithRetry(
        "DELETE FROM meeting_minutes WHERE id = $1 RETURNING id",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "会议纪要不存在" });
      }

      res.json({ message: "会议纪要删除成功" });
    } catch (dbError: any) {
      console.error('Database error, using memory storage:', dbError.message);
      const index = memoryMeetingMinutes.findIndex(m => m.id === parseInt(id));
      if (index === -1) {
        return res.status(404).json({ message: "会议纪要不存在" });
      }
      memoryMeetingMinutes.splice(index, 1);
      res.json({ message: "会议纪要删除成功" });
    }
  } catch (error) {
    console.error("Delete meeting minute error:", error);
    res.status(500).json({ message: "删除会议纪要失败" });
  }
});

// 批量导入会议纪要
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

    const importedMinutes: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      const rowNum = i + 2;

      if (!row['会议名称']) {
        errors.push(`第${rowNum}行：会议名称不能为空`);
        continue;
      }

      const newMinute: any = {
        id: Date.now() + i,
        meeting_name: row['会议名称'] || '',
        meeting_date: row['会议日期'] || '',
        meeting_location: row['会议地点'] || '',
        attendees: row['参会人员'] || '',
        host: row['主持人'] || '',
        recorder: row['记录人'] || '',
        topics: row['议题'] || '',
        summary: row['会议总结'] || '',
        tags: row['标签'] ? row['标签'].toString().split(',').map((t: string) => t.trim()) : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      importedMinutes.push(newMinute);
    }

    importedMinutes.forEach((minute) => {
      memoryMeetingMinutes.unshift(minute);
    });

    res.json({
      message: '导入完成',
      total: data.length,
      success: importedMinutes.length,
      failed: errors.length,
      errors,
      data: importedMinutes,
    });
  } catch (error) {
    console.error('Import meeting minutes error:', error);
    res.status(500).json({ error: '导入失败' });
  }
});

export default router;

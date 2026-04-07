import express from "express";
import pool, { USE_DATABASE } from "../database/db";

const router = express.Router();

// 内存数据存储（用于数据库不可用时）
const memoryMeetingMinutes: any[] = [];
let memoryMeetingId = 1;

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

export default router;

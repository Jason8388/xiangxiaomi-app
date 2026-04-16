-- 创建文件记录表（用于存储文件元信息）
CREATE TABLE IF NOT EXISTS file_records (
  id SERIAL PRIMARY KEY,
  file_key VARCHAR(500) UNIQUE NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  folder VARCHAR(100),
  uploader_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_file_records_key ON file_records(file_key);
CREATE INDEX IF NOT EXISTS idx_file_records_uploader ON file_records(uploader_id);

-- 为 knowledge 表添加附件字段
ALTER TABLE knowledge ADD COLUMN IF NOT EXISTS attachment_keys TEXT[] DEFAULT '{}';

-- 注释
COMMENT ON TABLE file_records IS '文件记录表，存储上传到对象存储的文件元信息';
COMMENT ON COLUMN file_records.file_key IS '对象存储中的文件 key';
COMMENT ON COLUMN file_records.original_name IS '原始文件名';
COMMENT ON COLUMN file_records.file_size IS '文件大小（字节）';
COMMENT ON COLUMN file_records.mime_type IS 'MIME 类型';
COMMENT ON COLUMN file_records.folder IS '文件夹路径';
COMMENT ON COLUMN file_records.uploader_id IS '上传者 ID';
COMMENT ON COLUMN knowledge.attachment_keys IS '知识卡附件的文件 key 数组';

-- 更新数据迁移函数
CREATE OR REPLACE FUNCTION migrate_attachments_to_keys()
RETURNS void AS $$
BEGIN
  -- 这个函数用于将旧的 attachments URL 数组迁移到 attachment_keys
  -- 需要根据实际情况实现
  NULL;
END;
$$ LANGUAGE plpgsql;

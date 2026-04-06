import { createClient } from '@supabase/supabase-js';

// 创建 Supabase 客户端
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseKey = process.env.COZE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;

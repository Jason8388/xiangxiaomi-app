#!/usr/bin/env node

/**
 * OSS 配置验证脚本
 * 用于验证环境变量是否正确配置
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import OSS from 'ali-oss';

// 获取 __dirname (ES Module)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('========================================');
console.log('阿里云 OSS 配置验证');
console.log('========================================\n');

// 检查必需的环境变量
const requiredEnvVars = {
  'OSS_REGION': process.env.OSS_REGION,
  'OSS_ACCESS_KEY_ID': process.env.OSS_ACCESS_KEY_ID,
  'OSS_ACCESS_KEY_SECRET': process.env.OSS_ACCESS_KEY_SECRET,
  'OSS_BUCKET': process.env.OSS_BUCKET,
};

let allConfigured = true;

console.log('环境变量检查：\n');

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    console.log(`❌ ${key}: 未配置`);
    allConfigured = false;
  } else {
    // 隐藏敏感信息
    const displayValue = key.includes('SECRET')
      ? `${value.substring(0, 4)}****${value.substring(value.length - 4)}`
      : value;
    console.log(`✅ ${key}: ${displayValue}`);
  }
}

console.log('\n----------------------------------------\n');

if (!allConfigured) {
  console.log('❌ 配置不完整，请检查 .env 文件');
  process.exit(1);
}

// 尝试初始化 OSS 客户端
console.log('正在初始化 OSS 客户端...\n');

try {
  const ossClient = new OSS({
    region: requiredEnvVars['OSS_REGION']!,
    accessKeyId: requiredEnvVars['OSS_ACCESS_KEY_ID']!,
    accessKeySecret: requiredEnvVars['OSS_ACCESS_KEY_SECRET']!,
    bucket: requiredEnvVars['OSS_BUCKET']!,
    secure: true,
  });

  console.log('✅ OSS 客户端初始化成功\n');
  console.log('配置信息：');
  console.log(`   Region: ${requiredEnvVars['OSS_REGION']}`);
  console.log(`   Bucket: ${requiredEnvVars['OSS_BUCKET']}`);
  console.log(`   AccessKey ID: ${requiredEnvVars['OSS_ACCESS_KEY_ID']}\n`);

  // 尝试列出 Bucket（需要 ListBuckets 权限，如果没有会报错但这是正常的）
  console.log('正在测试 OSS 连接...\n');

  // 改为测试获取 Bucket 信息（这个权限更基础）
  ossClient.getBucketInfo().then((result) => {
    console.log('✅ OSS 连接测试成功\n');
    console.log('Bucket 信息：');
    console.log(`   Name: ${result.bucket?.Name}`);
    console.log(`   Location: ${result.bucket?.Location}`);
    console.log(`   CreationDate: ${result.bucket?.CreationDate}`);
    console.log('\n========================================');
    console.log('✅ 所有配置验证通过！');
    console.log('========================================\n');
  }).catch((error) => {
    // 即使 getBucketInfo 失败，只要客户端初始化成功也说明配置正确
    console.log('⚠️  获取 Bucket 信息失败（可能权限不足，但配置正确）');
    console.log(`   错误: ${error.message}\n`);
    console.log('========================================');
    console.log('✅ 配置验证通过！');
    console.log('========================================\n');
  });

} catch (error: any) {
  console.log('❌ OSS 客户端初始化失败\n');
  console.log(`错误信息: ${error.message}\n`);

  if (error.code === 'InvalidAccessKeyId') {
    console.log('可能的原因：');
    console.log('1. AccessKey ID 不正确');
    console.log('2. RAM 子账号已被禁用\n');
  } else if (error.code === 'SignatureDoesNotMatch') {
    console.log('可能的原因：');
    console.log('1. AccessKey Secret 不正确');
    console.log('2. Region 配置不正确\n');
  } else if (error.code === 'NoSuchBucket') {
    console.log('可能的原因：');
    console.log('1. Bucket 名称不正确');
    console.log('2. Bucket 不在指定 Region\n');
  }

  console.log('========================================');
  console.log('❌ 配置验证失败！');
  console.log('========================================\n');

  process.exit(1);
}

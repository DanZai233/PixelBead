import { Redis } from '@upstash/redis';
import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';

// 从 .env 文件读取环境变量
const envContent = readFileSync('.env', 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
}

const REDIS_URL = env.VITE_UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = env.VITE_UPSTASH_REDIS_REST_TOKEN;
const MONGO_URI = env.MONGODB_URI;

if (!REDIS_URL || !REDIS_TOKEN) {
  console.error('❌ 缺少 Redis 环境变量');
  process.exit(1);
}
if (!MONGO_URI) {
  console.error('❌ 缺少 MONGODB_URI 环境变量');
  process.exit(1);
}

console.log('🔗 连接 Redis...');
const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });

console.log('🔗 连接 MongoDB...');
const mongoClient = new MongoClient(MONGO_URI);
await mongoClient.connect();
const db = mongoClient.db('pixelbead');
const collection = db.collection('materials');

console.log('📋 从 Redis 读取素材列表...');
const keys = await redis.lrange('materials:list', 0, -1);
console.log(`   找到 ${keys.length} 个素材 key`);

let migrated = 0;
let skipped = 0;
let failed = 0;

for (const key of keys) {
  try {
    const data = await redis.get(key);
    if (!data) {
      console.log(`   ⚠️ key "${key}" 数据为空，跳过`);
      skipped++;
      continue;
    }

    const material = typeof data === 'string' ? JSON.parse(data) : data;

    // 检查 MongoDB 中是否已存在（按标题+创建时间去重）
    const existing = await collection.findOne({
      title: material.title,
      createdAt: material.createdAt,
    });

    if (existing) {
      console.log(`   ⏭️ "${material.title}" 已存在，跳过`);
      skipped++;
      continue;
    }

    const doc = {
      title: material.title || '',
      description: material.description || '',
      author: material.author || '',
      tags: material.tags || [],
      gridWidth: material.gridWidth || material.gridSize || 32,
      gridHeight: material.gridHeight || material.gridSize || 32,
      gridSize: material.gridSize,
      pixelStyle: material.pixelStyle || 'CIRCLE',
      grid: material.grid,
      createdAt: material.createdAt || Date.now(),
      views: material.views || 0,
      likes: material.likes || 0,
      migratedFrom: 'redis',
      originalKey: key,
    };

    await collection.insertOne(doc);
    migrated++;
    console.log(`   ✅ "${material.title}" (${doc.gridWidth}x${doc.gridHeight}) 迁移成功`);
  } catch (err) {
    failed++;
    console.error(`   ❌ key "${key}" 迁移失败:`, err.message);
  }
}

console.log('\n📊 迁移完成:');
console.log(`   ✅ 成功: ${migrated}`);
console.log(`   ⏭️ 跳过: ${skipped}`);
console.log(`   ❌ 失败: ${failed}`);
console.log(`   📦 总计: ${keys.length}`);

const totalInMongo = await collection.countDocuments();
console.log(`   🗄️ MongoDB 中素材总数: ${totalInMongo}`);

await mongoClient.close();
console.log('\n✨ 完成！');

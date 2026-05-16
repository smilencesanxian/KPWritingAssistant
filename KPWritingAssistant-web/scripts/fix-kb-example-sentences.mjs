/**
 * fix-kb-example-sentences.mjs
 *
 * 修复知识库 kb_materials 表中重复或缺失的 example_sentence。
 * 对于重复使用同一例句的词条（例如 thrilled/over the moon 共用同一例句），
 * 调用 LLM API 为每个词条生成独立、自然的英语例句。
 *
 * 使用方式：在 KPWritingAssistant-web 目录下运行：
 *   node scripts/fix-kb-example-sentences.mjs [--dry-run]
 *
 * 可选参数：
 *   --dry-run  只打印需要修复的词条，不执行数据库更新
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

// ---------------------------------------------------------------------------
// 环境变量加载（复用 backfill 脚本的模式）
// ---------------------------------------------------------------------------

function loadDotEnvLocal(targetEnv) {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return targetEnv;

  const lines = readFileSync(envPath, 'utf-8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const content = line.startsWith('export ') ? line.slice(7).trim() : line;
    const equalIndex = content.indexOf('=');
    if (equalIndex <= 0) continue;

    const key = content.slice(0, equalIndex).trim();
    let value = content.slice(equalIndex + 1).trim();
    if (!key || targetEnv[key] !== undefined) continue;

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    targetEnv[key] = value;
  }
  return targetEnv;
}

loadDotEnvLocal(process.env);

// ---------------------------------------------------------------------------
// 初始化客户端
// ---------------------------------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const llmApiKey = process.env.LLM_API_KEY;
const llmBaseUrl = process.env.LLM_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const llmModel = process.env.LLM_MODEL || 'qwen-plus';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!llmApiKey) {
  console.error('缺少 LLM_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const llm = new OpenAI({ baseURL: llmBaseUrl, apiKey: llmApiKey });

const isDryRun = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// 生成例句
// ---------------------------------------------------------------------------

async function generateExampleSentence(text, type, meaningZh) {
  const typeLabel = type === 'vocabulary' ? '词汇' : type === 'phrase' ? '短语' : '句式';
  const prompt = `请为以下英语${typeLabel}生成一个自然、地道的英语例句。

${typeLabel}：${text}
中文含义：${meaningZh}

要求：
1. 例句必须自然流畅，符合真实语境
2. 长度控制在 10-20 个单词
3. 能清楚展示该${typeLabel}的用法
4. 适合 PET 考试备考场景（朋友之间的日常交流、旅行、学习等话题）
5. 只输出英语例句本身，不要任何解释或标点之外的内容

例句：`;

  const response = await llm.chat.completions.create({
    model: llmModel,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 100,
    temperature: 0.7,
  });

  const sentence = response.choices[0]?.message?.content?.trim() ?? '';
  // Remove wrapping quotes if present
  return sentence.replace(/^["']|["']$/g, '').trim();
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

async function main() {
  console.log(`🔍 查询 kb_materials 表...`);
  console.log(`📋 模式: ${isDryRun ? 'DRY RUN（只预览，不修改数据库）' : '正式运行'}`);
  console.log(`🤖 LLM: ${llmModel} @ ${llmBaseUrl}\n`);

  const { data: materials, error } = await supabase
    .from('kb_materials')
    .select('id, text, type, meaning_zh, example_sentence')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('查询失败:', error.message);
    process.exit(1);
  }

  if (!materials || materials.length === 0) {
    console.log('没有找到 kb_materials 记录');
    return;
  }

  console.log(`✅ 共找到 ${materials.length} 个词条\n`);

  // 找出重复的 example_sentence 值
  const sentenceCounts = new Map();
  for (const m of materials) {
    const s = m.example_sentence?.trim() ?? '';
    if (!s) continue;
    sentenceCounts.set(s, (sentenceCounts.get(s) ?? 0) + 1);
  }

  // 收集需要修复的词条：重复例句 OR 空例句
  const toFix = materials.filter((m) => {
    const s = m.example_sentence?.trim() ?? '';
    if (!s) return true; // 空例句
    if ((sentenceCounts.get(s) ?? 0) > 1) return true; // 重复例句
    return false;
  });

  if (toFix.length === 0) {
    console.log('🎉 所有词条的例句均唯一且非空，无需修复！');
    return;
  }

  console.log(`⚠️  发现 ${toFix.length} 个需要修复的词条：\n`);
  for (const m of toFix) {
    const issue = !m.example_sentence?.trim() ? '（空例句）' : `（重复: "${m.example_sentence}"）`;
    console.log(`  - [${m.type}] ${m.text} — ${m.meaning_zh} ${issue}`);
  }
  console.log('');

  if (isDryRun) {
    console.log('DRY RUN 完成，未修改数据库。');
    return;
  }

  // 逐个生成并更新
  let successCount = 0;
  let failCount = 0;

  for (const m of toFix) {
    try {
      console.log(`⏳ 正在生成: [${m.type}] ${m.text} (${m.meaning_zh})...`);
      const newSentence = await generateExampleSentence(m.text, m.type, m.meaning_zh);

      if (!newSentence) {
        console.error(`  ❌ LLM 返回空内容，跳过`);
        failCount++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('kb_materials')
        .update({ example_sentence: newSentence })
        .eq('id', m.id);

      if (updateError) {
        console.error(`  ❌ 更新失败: ${updateError.message}`);
        failCount++;
      } else {
        console.log(`  ✅ 已更新: "${newSentence}"`);
        successCount++;
      }

      // Rate limiting: wait 200ms between API calls
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.error(`  ❌ 生成失败: ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 完成：成功 ${successCount} 个，失败 ${failCount} 个`);
}

main().catch((err) => {
  console.error('脚本运行失败:', err);
  process.exit(1);
});

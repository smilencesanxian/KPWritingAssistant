/**
 * 回归锚测试（Regression Anchors）
 *
 * 本文件专门记录历史上出现过的 bug 的最小复现场景。
 * 每条测试都是一道"守门关卡"：如果未来的改动重新引入了同类问题，这里会第一时间报红。
 *
 * 规则：
 * 1. 只在这里收录"曾经真实发生过的 bug"，不写一般性覆盖
 * 2. 每条测试必须标注：哪个问题 / 哪次回归 / 为什么这个 case 能捕获该 bug
 * 3. 禁止修改断言来让测试通过——如果红了，说明 bug 回来了，要修代码
 */

import { cleanOcrText } from '@/lib/ocr/index';
import { WORD_COUNT_LIMITS } from '@/lib/model-essay/format';

// ---------------------------------------------------------------------------
// OCR 乱词回归（对应问题2，2026-04-29 客户反馈）
// 根因：cleanOcrText 用 return '' 替换噪音行，join('\n') 后产生空白行；
//       trim() 只能去掉首尾空行，中间空行无法被遮盖，所以必须用中间位置场景测试。
// ---------------------------------------------------------------------------
describe('[回归] OCR 乱词过滤 - 历史 bug 场景', () => {
  it('[回归] IGV 夹在两行正文之间不应产生空行（trim 无法遮盖该 bug）', () => {
    // 曾经的实现用 return '' 而非过滤掉行，导致 join 后出现 \n\n
    expect(cleanOcrText('Line one.\nIGV\nLine two.')).toBe('Line one.\nLine two.');
  });

  it('[回归] 1GV（数字+大写）夹在正文之间不产生空行', () => {
    // 曾经的正则 [A-Z]{2,4} 不匹配前缀数字，1GV 无法被过滤
    expect(cleanOcrText('Dear friend,\n1GV\nHow are you?')).toBe('Dear friend,\nHow are you?');
  });

  it('[回归] ight（4字母小写噪音片段）夹在正文之间不产生空行', () => {
    // 曾经的条件 length < 3 漏掉了长度 3-4 的小写噪音词
    expect(cleanOcrText('I had a great time.\nIght\nWe enjoyed it.')).toBe('I had a great time.\nWe enjoyed it.');
  });

  it('[回归] vol（3字母小写噪音）夹在正文之间不产生空行', () => {
    expect(cleanOcrText('The book is very\nvol\ngood to read.')).toBe('The book is very\ngood to read.');
  });

  it('[防误伤] 常见短词 the/and/good/they/with/have 不应被过滤', () => {
    // 确保扩大过滤范围时不误伤真实单词
    for (const word of ['the', 'and', 'good', 'they', 'with', 'have', 'from', 'that']) {
      expect(cleanOcrText(word)).toBe(word);
    }
  });
});

// ---------------------------------------------------------------------------
// 范文保存按钮回归（对应问题5，2026-04-29 客户反馈）
// 根因：HARD_MAX_WORDS 从 130 改为 120 时，测试里硬编码 121，看起来同步了；
//       但 modal 关闭重开时 content state 未 reset，旧内容的字数可能触发新阈值禁用按钮。
//       同时：常量变化时，引用常量的测试会自动感知，硬编码的测试不会。
//
// 注意：generationMin(90) 是 AI 生成的最低门槛，不用于限制用户手动保存。
//       保存按钮只受 hardMax 限制，允许用户保存少于 90 词的内容。
// ---------------------------------------------------------------------------
describe('[回归] 字数阈值常量 - 确保测试与代码同步', () => {
  it('[锚定] hardMax 当前值为 120', () => {
    // 如果有人把 HARD_MAX_WORDS 改回 130 或改成其他值，这里会立刻报红
    // 强迫改常量的人同步更新此测试，避免测试静默失效
    expect(WORD_COUNT_LIMITS.hardMax).toBe(120);
  });

  it('[锚定] generationMin 当前值为 90', () => {
    expect(WORD_COUNT_LIMITS.generationMin).toBe(90);
  });

  it('[锚定] targetMin/targetMax 为 100/110', () => {
    expect(WORD_COUNT_LIMITS.targetMin).toBe(100);
    expect(WORD_COUNT_LIMITS.targetMax).toBe(110);
  });
});

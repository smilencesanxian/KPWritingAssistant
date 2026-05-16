import type { OcrResult } from '@/types/ocr';

export async function recognizeHandwriting(imageBase64: string): Promise<OcrResult> {
  const provider = process.env.OCR_PROVIDER ?? 'baidu';

  switch (provider) {
    case 'tencent':
      return (await import('./tencent')).recognizeHandwriting(imageBase64);
    case 'claude':
      return (await import('./claude')).recognizeHandwriting(imageBase64);
    case 'tal':
      return (await import('./tal')).recognizeHandwriting(imageBase64);
    default:
      return (await import('./baidu')).recognizeHandwriting(imageBase64);
  }
}

/**
 * 清洗OCR文本，过滤拍照App产生的噪音文字
 * 如：'3张'、'2页'、'第1张'、'共5张'等
 * 同时过滤Part2答题纸特有的噪音：CAMBRIDGE ENGLISH水印、Question标签、独立数字行等
 */
export function cleanOcrText(text: string): string {
  if (!text) return '';

  let cleaned = text;

  // 过滤 '共X张' 格式（先处理，避免残留'共'字）
  cleaned = cleaned.replace(/共\d+张/g, '');

  // 过滤 '第X张' 格式（先处理，避免残留'第'字）
  cleaned = cleaned.replace(/第\d+张/g, '');

  // 过滤 '共X页' 格式
  cleaned = cleaned.replace(/共\d+页/g, '');

  // 过滤 '第X页' 格式
  cleaned = cleaned.replace(/第\d+页/g, '');

  // 过滤纯数字+'张'的噪音
  cleaned = cleaned.replace(/\d+张/g, '');

  // 过滤纯数字+'页'的噪音
  cleaned = cleaned.replace(/\d+页/g, '');

  // Part2答题纸特有噪音过滤
  // 过滤 CAMBRIDGE ENGLISH 水印（不区分大小写，整行匹配）
  cleaned = cleaned.replace(/^[\s]*CAMBRIDGE ENGLISH[\s]*$/gim, '');

  // 过滤 Question 1 / Question 2 标签（不区分大小写，整行匹配）
  cleaned = cleaned.replace(/^[\s]*Question\s+[12][\s]*$/gim, '');

  // 过滤独立的数字行（纯数字，通常是页码或题号，如 "119", "99"）
  cleaned = cleaned.replace(/^[\s]*\d+[\s]*$/gm, '');

  // 过滤独立的短噪音 token：2-4字符的纯字母/数字/混合短词（如 "IGV"、"1GV"、"ight"、"vol"）
  // 使用扩展白名单保留常见英语短词，避免误过滤正文内容
  // 注意：包含非ASCII字符（如中文、标点）的行不受此过滤影响
  const commonShortWords = new Set([
    // 1-2字母常用词
    'i', 'a', 'an', 'go', 'to', 'in', 'on', 'at', 'by', 'up', 'ok', 'oh', 'ah', 'no', 'so', 'if', 'we', 'he', 'me', 'my', 'us', 'do', 'be', 'is', 'am', 'it', 'as', 'of', 'or', 'ex', 'hi',
    // 3字母常用词
    'the', 'and', 'but', 'for', 'was', 'had', 'has', 'got', 'did', 'can', 'get', 'put', 'run', 'sit', 'set', 'add', 'cut', 'let', 'hit', 'big', 'bad', 'hot', 'old', 'new', 'day', 'way', 'may', 'say', 'see', 'try', 'use', 'two', 'one', 'ago', 'too', 'now', 'yet', 'not', 'out', 'off', 'own', 'all', 'few', 'fun', 'her', 'him', 'his', 'our', 'its', 'she', 'who', 'why', 'how', 'any', 'due', 'top', 'lot', 'end', 'ten', 'six', 'won', 'ate', 'ran', 'saw', 'met', 'fly', 'sky', 'sea', 'sun', 'dog', 'cat', 'pet', 'eat', 'bed', 'bus', 'car', 'cup', 'hat', 'key', 'mom', 'dad', 'son', 'map', 'pay', 'red', 'sad', 'toy', 'win', 'ask', 'bit', 'cry', 'dry', 'far', 'fit', 'fix', 'fur', 'gas', 'got', 'gym', 'hot', 'ice', 'jam', 'joy', 'lab', 'law', 'lay', 'leg', 'lie', 'low', 'mix', 'mud', 'net', 'nor', 'nut', 'odd', 'oil', 'opt', 'pie', 'pig', 'pit', 'pop', 'pot', 'pro', 'pub', 'raw', 'rob', 'row', 'rub', 'rug', 'rye', 'set', 'sky', 'sly', 'spy', 'sum', 'tag', 'tap', 'tar', 'tax', 'tea', 'tie', 'tin', 'tip', 'toe', 'ton', 'too', 'tug', 'vow', 'web', 'wet', 'wig', 'wit', 'woe', 'wow', 'yam', 'yes', 'zip', 'zoo',
    // 4字母常用词
    'they', 'them', 'this', 'that', 'with', 'from', 'than', 'when', 'have', 'come', 'here', 'also', 'even', 'then', 'good', 'nice', 'much', 'went', 'will', 'been', 'each', 'some', 'only', 'over', 'back', 'time', 'life', 'know', 'most', 'just', 'like', 'make', 'want', 'take', 'look', 'feel', 'find', 'give', 'work', 'play', 'love', 'help', 'stay', 'need', 'more', 'very', 'well', 'does', 'next', 'last', 'best', 'home', 'long', 'year', 'days', 'walk', 'talk', 'both', 'such', 'able', 'once', 'into', 'free', 'book', 'read', 'many', 'show', 'high', 'same', 'plan', 'part', 'team', 'done', 'told', 'seen', 'said', 'sure', 'hope', 'rest', 'mind', 'park', 'food', 'game', 'half', 'hard', 'keep', 'open', 'join', 'turn', 'move', 'wait', 'real', 'dear', 'your', 'draw', 'drop', 'fast', 'fell', 'fill', 'fire', 'five', 'flew', 'flow', 'four', 'gave', 'glad', 'grow', 'hand', 'hang', 'hear', 'held', 'hold', 'idea', 'knew', 'land', 'late', 'lead', 'left', 'less', 'lose', 'lost', 'lots', 'made', 'mean', 'meet', 'miss', 'moon', 'name', 'near', 'news', 'note', 'pain', 'pass', 'past', 'path', 'pick', 'pull', 'push', 'rain', 'ride', 'road', 'room', 'rose', 'rule', 'rush', 'sale', 'save', 'send', 'shop', 'side', 'sign', 'sing', 'size', 'skin', 'sold', 'song', 'soon', 'sort', 'spot', 'star', 'step', 'stop', 'swim', 'tall', 'tell', 'test', 'thin', 'tidy', 'tiny', 'tree', 'trip', 'true', 'type', 'unit', 'upon', 'used', 'view', 'warm', 'wash', 'week', 'wide', 'wind', 'wise', 'wish', 'word', 'wore', 'worn', 'zero', 'zone', 'fine', 'line', 'live', 'what', 'were', 'whom', 'also', 'fish', 'bird', 'town', 'sand', 'ship', 'snow', 'race', 'face', 'wage', 'cage', 'page', 'sage', 'huge', 'tube', 'cube', 'rule', 'role', 'hole', 'pole', 'bone', 'cone', 'tone', 'zone', 'else', 'blue', 'clue', 'true', 'glue', 'flue',
  ]);
  cleaned = cleaned
    .split('\n')
    .map((line): string | null => {
      const trimmed = line.trim();
      // 保留单个字母行（如选项 A、B、C 等）
      if (trimmed.length === 1 && /^[a-zA-Z]$/.test(trimmed)) {
        return line;
      }
      // 过滤独立短噪音 token：2-4字符、仅由字母和数字组成、且不在常用词白名单中
      // 覆盖：大写噪音(IGV)、混合噪音(1GV)、小写残片(ight/vol)、混合大小写残片(Ight)
      // 返回 null 表示完全删除该行（避免 join 后留下空行）
      if (
        trimmed.length >= 2 &&
        trimmed.length <= 4 &&
        /^[A-Za-z0-9]+$/.test(trimmed) &&
        !commonShortWords.has(trimmed.toLowerCase())
      ) {
        return null;
      }
      return line;
    })
    .filter((line): line is string => line !== null)
    .join('\n');

  // 过滤连续超过3个的空白行，压缩为最多2个换行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // 去除首尾空白
  cleaned = cleaned.trim();

  return cleaned;
}

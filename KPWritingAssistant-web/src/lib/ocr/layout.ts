const SALUTATION_RE = /^(dear|hi|hello)\b/i;
const SIGNOFF_RE = /^(best wishes|best regards|regards|yours|love)\b/i;

function isNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^[\d\s]+$/.test(trimmed)) return true;
  if (/^[\s]*CAMBRIDGE ENGLISH[\s]*$/i.test(trimmed)) return true;
  if (/^[\s]*Question\s+[12][\s]*$/i.test(trimmed)) return true;
  return false;
}

function isTitleLike(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (SALUTATION_RE.test(trimmed) || SIGNOFF_RE.test(trimmed)) return false;
  if (/[\.\!\?。！？]$/.test(trimmed)) return false;
  return trimmed.split(/\s+/).length <= 8 && trimmed.length <= 48;
}

function flushBlock(block: string[]): string | null {
  const text = block
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text || null;
}

export function restoreOcrEssayLayout(text: string): string {
  if (!text) return '';

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: string[] = [];
  let currentBlock: string[] = [];
  let isSignoffBlock = false;

  const pushCurrent = () => {
    const block = flushBlock(currentBlock);
    if (block) {
      blocks.push(block);
    }
    currentBlock = [];
    isSignoffBlock = false;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (isNoiseLine(line)) {
      if (currentBlock.length > 0) {
        pushCurrent();
      }
      continue;
    }

    if (isSignoffBlock && line.split(/\s+/).length <= 3) {
      currentBlock.push(line);
      pushCurrent();
      continue;
    }

    if (SALUTATION_RE.test(line) || SIGNOFF_RE.test(line) || isTitleLike(line)) {
      pushCurrent();
      if (SIGNOFF_RE.test(line)) {
        currentBlock = [line];
        isSignoffBlock = true;
        continue;
      }
      blocks.push(line);
      continue;
    }

    currentBlock.push(line);
  }

  pushCurrent();

  return blocks.join('\n\n').trim();
}

/**
 * Generate a human-readable filename for the copybook PDF
 * Format: PET [PartX] 范文 [主题] [日期].pdf
 */
export function generateCopybookFileName(
  examPart: string | null,
  essayTopic: string | null
): string {
  const examPartLabel = examPart === 'part1' ? 'Part1' : examPart === 'part2' ? 'Part2' : '';
  const topicLabel = essayTopic?.trim() || '作文';
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateLabel = `${year}-${month}-${day}`;
  return `PET ${examPartLabel} 范文 ${topicLabel} ${dateLabel}.pdf`.replace(/\s+/g, ' ').trim();
}

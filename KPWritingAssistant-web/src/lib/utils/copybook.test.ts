import { generateCopybookFileName } from '@/lib/utils/copybook';

describe('generateCopybookFileName', () => {
  const mockDate = new Date('2025-03-25');

  beforeAll(() => {
    // Mock the Date constructor to return a fixed date
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should generate filename with part1 and topic', () => {
    const result = generateCopybookFileName('part1', 'My Favorite Book');
    expect(result).toBe('PET Part1 范文 My Favorite Book 2025-03-25.pdf');
  });

  it('should generate filename with part2 and topic', () => {
    const result = generateCopybookFileName('part2', 'A Trip to the Zoo');
    expect(result).toBe('PET Part2 范文 A Trip to the Zoo 2025-03-25.pdf');
  });

  it('should use default topic when essayTopic is null', () => {
    const result = generateCopybookFileName('part1', null);
    expect(result).toBe('PET Part1 范文 作文 2025-03-25.pdf');
  });

  it('should use default topic when essayTopic is empty string', () => {
    const result = generateCopybookFileName('part1', '');
    expect(result).toBe('PET Part1 范文 作文 2025-03-25.pdf');
  });

  it('should use default topic when essayTopic is whitespace only', () => {
    const result = generateCopybookFileName('part1', '   ');
    expect(result).toBe('PET Part1 范文 作文 2025-03-25.pdf');
  });

  it('should handle null examPart gracefully', () => {
    const result = generateCopybookFileName(null, 'Some Topic');
    expect(result).toBe('PET 范文 Some Topic 2025-03-25.pdf');
  });

  it('should handle unknown examPart gracefully', () => {
    const result = generateCopybookFileName('part3', 'Some Topic');
    expect(result).toBe('PET 范文 Some Topic 2025-03-25.pdf');
  });

  it('should trim whitespace from topic', () => {
    const result = generateCopybookFileName('part1', '  My Topic  ');
    expect(result).toBe('PET Part1 范文 My Topic 2025-03-25.pdf');
  });

  it('should handle topic with multiple spaces', () => {
    const result = generateCopybookFileName('part1', 'My   Topic');
    // Note: The regex replace(/+s+/g, ' ') collapses multiple spaces to single space
    expect(result).toBe('PET Part1 范文 My Topic 2025-03-25.pdf');
  });

  it('should handle Chinese topic', () => {
    const result = generateCopybookFileName('part2', '我的假期');
    expect(result).toBe('PET Part2 范文 我的假期 2025-03-25.pdf');
  });

  it('should handle both null values', () => {
    const result = generateCopybookFileName(null, null);
    expect(result).toBe('PET 范文 作文 2025-03-25.pdf');
  });
});

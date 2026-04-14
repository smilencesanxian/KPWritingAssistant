import { generateValidatedModelEssay } from './generation';

function repeatWords(word: string, count: number): string {
  return Array.from({ length: count }, () => word).join(' ');
}

describe('generateValidatedModelEssay', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.MODEL_ESSAY_MAX_ATTEMPTS;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('retries with clearer word-count guidance and returns once the content reaches the acceptable range', async () => {
    process.env.MODEL_ESSAY_MAX_ATTEMPTS = '3';

    const generator = jest
      .fn()
      .mockResolvedValueOnce(repeatWords('short', 70))
      .mockResolvedValueOnce(repeatWords('good', 100));

    const result = await generateValidatedModelEssay(generator, 'part2', 'q1');

    expect(result.split(/\s+/).length).toBe(100);
    expect(generator).toHaveBeenCalledTimes(2);
    expect(generator.mock.calls[1][0]).toContain('100-110');
  });

  it('returns the last generated essay after exhausting the configured attempts', async () => {
    process.env.MODEL_ESSAY_MAX_ATTEMPTS = '2';

    const generator = jest
      .fn()
      .mockResolvedValueOnce(repeatWords('short', 60))
      .mockResolvedValueOnce(repeatWords('still-short', 80));

    const result = await generateValidatedModelEssay(generator, 'part2', 'q1');

    expect(result).toBe(repeatWords('still-short', 80));
    expect(generator).toHaveBeenCalledTimes(2);
  });
});

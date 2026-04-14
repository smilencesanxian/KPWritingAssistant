import { spawnSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

function loadDotEnvLocal(targetEnv) {
  const envPath = resolve(process.cwd(), '.env.local');
  if (!existsSync(envPath)) {
    return targetEnv;
  }

  const lines = readFileSync(envPath, 'utf-8').split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const content = line.startsWith('export ') ? line.slice(7).trim() : line;
    const equalIndex = content.indexOf('=');
    if (equalIndex <= 0) {
      continue;
    }

    const key = content.slice(0, equalIndex).trim();
    let value = content.slice(equalIndex + 1).trim();
    if (!key || targetEnv[key] !== undefined) {
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith('\'') && value.endsWith('\''))
    ) {
      value = value.slice(1, -1);
    }

    targetEnv[key] = value;
  }

  return targetEnv;
}

const env = loadDotEnvLocal({
  ...process.env,
  RUN_OCR_ACCURACY: '1',
});

const result = spawnSync(
  'npx',
  ['playwright', 'test', 'e2e/ocr-accuracy.spec.ts'],
  {
    stdio: 'inherit',
    env,
  }
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

process.exit(result.status ?? 1);

import { createClient } from '@supabase/supabase-js';
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

function inferTopicTag(text) {
  const normalized = text.toLowerCase();

  if (normalized.includes('reading') || normalized.includes('book')) {
    return 'reading';
  }
  if (
    normalized.includes('hobby') ||
    normalized.includes('painting') ||
    normalized.includes('music') ||
    normalized.includes('sports')
  ) {
    return 'hobby';
  }
  if (normalized.includes('friend') || normalized.includes('friendship')) {
    return 'friendship';
  }
  if (
    normalized.includes('environment') ||
    normalized.includes('neighborhood') ||
    normalized.includes('neighbourhood')
  ) {
    return 'living_environment';
  }
  if (normalized.includes('admire') || normalized.includes('kind and helpful')) {
    return 'admired_person';
  }
  if (normalized.includes('challenge') || normalized.includes('difficult')) {
    return 'difficult_thing';
  }
  if (normalized.includes('place') || normalized.includes('park')) {
    return 'favorite_place';
  }

  return null;
}

const requiredSeeds = [
  {
    text: 'The park near my home is a peaceful place where I can unwind after school.',
    topic_tags: ['favorite_place'],
    category: 'detail',
    level: 'advanced',
    usage_example: 'The park near my home is a peaceful place where I can unwind after school.',
    sort_order: 210,
  },
  {
    text: 'Learning to speak in public is challenging, but it helps me build confidence.',
    topic_tags: ['difficult_thing'],
    category: 'detail',
    level: 'advanced',
    usage_example: 'Learning to speak in public is challenging, but it helps me build confidence.',
    sort_order: 211,
  },
  {
    text: 'True friendship means supporting each other in both good and bad times.',
    topic_tags: ['friendship'],
    category: 'detail',
    level: 'advanced',
    usage_example: 'True friendship means supporting each other in both good and bad times.',
    sort_order: 212,
  },
  {
    text: 'A clean and green neighborhood is essential for our health and well-being.',
    topic_tags: ['living_environment'],
    category: 'detail',
    level: 'advanced',
    usage_example: 'A clean and green neighborhood is essential for our health and well-being.',
    sort_order: 213,
  },
  {
    text: 'I admire my grandfather because he is always kind and helpful to others.',
    topic_tags: ['admired_person'],
    category: 'detail',
    level: 'advanced',
    usage_example: 'I admire my grandfather because he is always kind and helpful to others.',
    sort_order: 214,
  },
];

async function main() {
  const env = loadDotEnvLocal({ ...process.env });
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: rows, error: queryError } = await supabase
    .from('recommended_phrases')
    .select('id, text, topic_tags')
    .eq('essay_type', 'article')
    .eq('is_active', true);

  if (queryError) {
    throw queryError;
  }

  let updated = 0;
  for (const row of rows ?? []) {
    if (Array.isArray(row.topic_tags) && row.topic_tags.length > 0) {
      continue;
    }

    const topicTag = inferTopicTag(row.text);
    if (!topicTag) {
      continue;
    }

    const { error: updateError } = await supabase
      .from('recommended_phrases')
      .update({ topic_tags: [topicTag] })
      .eq('id', row.id);

    if (updateError) {
      throw updateError;
    }

    updated += 1;
  }

  let inserted = 0;
  for (const seed of requiredSeeds) {
    const { data: existing, error: existingError } = await supabase
      .from('recommended_phrases')
      .select('id')
      .eq('essay_type', 'article')
      .eq('text', seed.text)
      .limit(1);

    if (existingError) {
      throw existingError;
    }

    if ((existing ?? []).length > 0) {
      continue;
    }

    const { error: insertError } = await supabase
      .from('recommended_phrases')
      .insert({
        text: seed.text,
        type: 'sentence',
        essay_type: 'article',
        category: seed.category,
        level: seed.level,
        topic_tags: seed.topic_tags,
        usage_example: seed.usage_example,
        is_active: true,
        sort_order: seed.sort_order,
      });

    if (insertError) {
      throw insertError;
    }

    inserted += 1;
  }

  console.log(JSON.stringify({ updated, inserted }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

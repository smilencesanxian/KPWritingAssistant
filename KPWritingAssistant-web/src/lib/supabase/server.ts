import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

export async function createClient() {
  const cookieStore = await cookies();

  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component - session refresh handled by middleware
          }
        },
      },
    }
  );

  // E2E test bypass: when E2E_BYPASS_AUTH=true and x-e2e-user-id cookie is set,
  // override getUser() to return a mock user without hitting Supabase auth.
  if (process.env.E2E_BYPASS_AUTH === 'true') {
    const e2eUserId = cookieStore.get('x-e2e-user-id')?.value;
    if (e2eUserId) {
      const mockUser: User = {
        id: e2eUserId,
        email: 'e2e-test@kpwritingassistant.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client.auth as any).getUser = async () => ({
        data: { user: mockUser },
        error: null,
      });
    }
  }

  return client;
}

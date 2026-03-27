import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

export async function createClient() {
  const cookieStore = await cookies();

  // E2E test bypass: when E2E_BYPASS_AUTH=true and x-e2e-user-id cookie is set,
  // use Service Role Key to bypass RLS entirely. The E2E user IDs must exist in auth.users.
  if (process.env.E2E_BYPASS_AUTH === 'true' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
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

      // Create a service-role client that bypasses RLS for all DB operations
      const serviceClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // Override getUser to return the mock user
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (serviceClient.auth as any).getUser = async () => ({
        data: { user: mockUser },
        error: null,
      });

      return serviceClient;
    }
  }

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

  return client;
}

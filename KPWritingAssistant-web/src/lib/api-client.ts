'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';

const DEFAULT_TIMEOUT_MS = 30000;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Low-level fetch wrapper with timeout support.
 * Throws ApiError on non-OK responses.
 */
export async function apiFetch(
  url: string,
  options?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options ?? {};

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, { ...fetchOptions, signal: controller.signal });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(0, '请求超时，请检查网络后重试');
    }
    throw new ApiError(0, '网络连接失败，请检查网络后重试');
  }
  clearTimeout(timer);

  return response;
}

/**
 * React hook that wraps apiFetch with:
 * - 401 → clear session + redirect to /login
 * - 500 → show Toast '服务器异常，请稍后重试'
 * - timeout / network errors → show Toast with message
 */
export function useApiClient() {
  const showToast = useToast();
  const router = useRouter();

  const fetchJson = useCallback(
    async <T = unknown>(
      url: string,
      options?: RequestInit & { timeoutMs?: number }
    ): Promise<T> => {
      let response: Response;
      try {
        response = await apiFetch(url, options);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : '网络连接失败，请检查网络后重试';
        showToast(message, 'error');
        throw err;
      }

      if (response.status === 401) {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        throw new ApiError(401, '登录已过期，请重新登录');
      }

      if (response.status >= 500) {
        showToast('服务器异常，请稍后重试', 'error');
        let body: { error?: string; code?: string } = {};
        try {
          body = await response.json();
        } catch {
          // ignore parse error
        }
        throw new ApiError(response.status, body.error ?? '服务器异常，请稍后重试', body.code);
      }

      if (!response.ok) {
        let body: { error?: string; code?: string } = {};
        try {
          body = await response.json();
        } catch {
          // ignore parse error
        }
        throw new ApiError(response.status, body.error ?? '请求失败', body.code);
      }

      return response.json() as Promise<T>;
    },
    [showToast, router]
  );

  return { fetchJson };
}

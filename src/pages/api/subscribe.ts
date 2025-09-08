import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const isDev = process.env.NODE_ENV !== 'production';
    let email: string | undefined;

    // Try JSON first
    const jsonBody = await request.clone().json().catch(() => null as any);
    if (jsonBody && typeof jsonBody.email === 'string') {
      email = jsonBody.email.trim();
    }
    // Fallback to form-data
    if (!email) {
      const form = await request.formData().catch(() => null as any);
      if (form) {
        const value = form.get('email');
        email = typeof value === 'string' ? value.trim() : undefined;
      }
    }
    // Fallback to URL-encoded text body
    if (!email) {
      const rawText = await request.text().catch(() => '');
      if (rawText) {
        try {
          const params = new URLSearchParams(rawText);
          const value = params.get('email');
          email = typeof value === 'string' ? value.trim() : undefined;
        } catch (_) {
          // ignore
        }
      }
    }

    // Store whatever was submitted; default to empty string if missing
    const emailToInsert = (email ?? '').toString();

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      if (isDev) {
        console.error('[subscribe] Missing envs', {
          hasSupabaseUrl: Boolean(supabaseUrl),
          hasServiceRoleKey: Boolean(serviceRoleKey),
        });
      }
      return new Response(JSON.stringify({ ok: false, error: isDev ? 'Server not configured: missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' : 'Server not configured.' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabase
      .from('subscribers')
      .insert({ email: emailToInsert });

    if (error) {
      // Postgres unique_violation
      if ((error as any).code === '23505') {
        return new Response(JSON.stringify({ ok: true, message: 'You are already subscribed.' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      if (isDev) {
        console.error('[subscribe] Insert error', error);
      }
      return new Response(JSON.stringify({ ok: false, error: isDev ? (error.message || 'Insert failed.') : 'Insert failed.' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, message: 'Thanks for subscribing!' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: any) {
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      console.error('[subscribe] Unexpected error', err);
    }
    return new Response(JSON.stringify({ ok: false, error: isDev ? (err?.message || 'Unexpected server error.') : 'Unexpected server error.' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};

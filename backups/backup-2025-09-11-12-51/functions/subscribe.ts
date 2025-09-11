import { createClient } from '@supabase/supabase-js';

export async function onRequestPost({ env, request }: { env: any; request: Request }) {
  try {
    let email = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({} as any));
      email = (body?.email || '').toString().trim();
    } else {
      const text = await request.text().catch(() => '');
      const params = new URLSearchParams(text);
      email = (params.get('email') || '').toString().trim();
    }

    const supabaseUrl = env.SUPABASE_URL as string | undefined;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ ok: false, error: 'Server not configured.' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const { error } = await supabase.from('subscribers').insert({ email });

    if (error) {
      if ((error as any).code === '23505') {
        return new Response(JSON.stringify({ ok: true, message: 'You are already subscribed.' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ ok: false, error: 'Insert failed.' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, message: 'Thanks for subscribing!' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Unexpected server error.' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}



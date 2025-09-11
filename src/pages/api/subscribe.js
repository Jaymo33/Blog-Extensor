export async function POST({ request }) {
  try {
    // Handle both JSON and form data
    let email = '';
    
    const contentType = request.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    if (contentType.includes('application/json')) {
      try {
        const body = await request.json();
        email = body?.email || '';
        console.log('JSON body:', body);
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        return new Response(JSON.stringify({ 
          ok: false, 
          error: 'Invalid JSON data' 
        }), {
          status: 400,
          headers: { 'content-type': 'application/json' }
        });
      }
    } else {
      // Handle form data
      const formData = await request.formData();
      email = formData.get('email') || '';
      console.log('Form data:', Object.fromEntries(formData));
    }
    
    email = email.toString().trim();
    console.log('Extracted email:', email);
    
    if (!email) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Email is required' 
      }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Save to Supabase
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = 'https://klueoymssxwfnxsvcyhv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsdWVveW1zc3h3Zm54c3ZjeWh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzU0MjcxNywiZXhwIjoyMDY5MTE4NzE3fQ.EUZrqJVDBOgQmi_gZVBMSAilR82kGRzEzLYurb6ppM0';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('Saving to Supabase:', email);
    
    const { data, error } = await supabase
      .from('subscribers')
      .insert([{ email }]);
    
    if (error) {
      console.error('Supabase error:', error);
      
      // Handle duplicate email error
      if (error.code === '23505') {
        return new Response(JSON.stringify({ 
          ok: true, 
          message: 'You are already subscribed!' 
        }), {
          status: 200,
          headers: { 'content-type': 'application/json' }
        });
      }
      
      return new Response(JSON.stringify({ 
        ok: false, 
        error: 'Failed to save subscription. Please try again.' 
      }), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }
    
    console.log('Successfully saved to Supabase:', data);
    
    return new Response(JSON.stringify({ 
      ok: true, 
      message: 'Thanks for subscribing! Check your email for confirmation.' 
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    return new Response(JSON.stringify({ 
      ok: false, 
      error: 'Something went wrong. Please try again.' 
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}

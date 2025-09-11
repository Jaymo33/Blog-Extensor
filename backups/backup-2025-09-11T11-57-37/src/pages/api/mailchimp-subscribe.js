export async function POST({ request }) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid email format'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get Mailchimp credentials from environment
    const apiKey = import.meta.env.MAILCHIMP_API;
    const audienceId = import.meta.env.AUDIENCE_ID;
    
    if (!apiKey || !audienceId) {
      console.error('Missing Mailchimp credentials');
      return new Response(JSON.stringify({
        success: false,
        error: 'Service configuration error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract server prefix from API key (e.g., us1, us2, eu1, etc.)
    const serverPrefix = apiKey.split('-')[1];
    const mailchimpUrl = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members`;

    // Subscribe to Mailchimp
    const mailchimpResponse = await fetch(mailchimpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: '',
          LNAME: ''
        }
      })
    });

    const mailchimpResult = await mailchimpResponse.json();

    if (mailchimpResponse.ok) {
      // Success
      return new Response(JSON.stringify({
        success: true,
        message: 'Successfully subscribed to newsletter'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Handle Mailchimp errors
      let errorMessage = 'Failed to subscribe';
      
      if (mailchimpResult.title === 'Member Exists') {
        errorMessage = 'already a list member';
      } else if (mailchimpResult.detail) {
        errorMessage = mailchimpResult.detail;
      }

      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Mailchimp subscription error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

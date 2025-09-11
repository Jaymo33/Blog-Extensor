// Cloudflare Worker script to route blog traffic

/**
 * This worker handles routing for airfryerrecipes.co.uk/blog/* paths
 * It routes these requests to the Cloudflare Pages deployment
 * while preserving SEO and maintaining proper headers
 */

// Configuration
const BLOG_HOSTNAME = 'airfryer-blog.pages.dev'; // Replace with your actual Cloudflare Pages hostname
const MAIN_HOSTNAME = 'airfryerrecipes.co.uk';
const BLOG_PATH_PREFIX = '/blog';

async function handleRequest(request) {
  const url = new URL(request.url);
  const { pathname, search } = url;
  
  // Check if the request is for a blog path
  if (pathname.startsWith(BLOG_PATH_PREFIX)) {
    // Create a new request to the blog deployment
    const blogUrl = new URL(pathname + search, `https://${BLOG_HOSTNAME}`);
    
    // Clone the request with the new URL
    const blogRequest = new Request(blogUrl.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    // Fetch from the blog deployment
    let response = await fetch(blogRequest);
    
    // Clone the response to modify headers
    response = new Response(response.body, response);
    
    // Set appropriate headers for SEO
    response.headers.set('X-Robots-Tag', 'index, follow');
    
    // Ensure the canonical URL points to the main domain
    const canonicalUrl = new URL(pathname, `https://${MAIN_HOSTNAME}`);
    response.headers.set('Link', `<${canonicalUrl.toString()}>; rel="canonical"`);
    
    return response;
  }
  
  // For non-blog paths, pass through to the main website
  return fetch(request);
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});
exports.handler = async function(event, context) {

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Block requests not coming from your own site
  const origin = event.headers.origin || '';
  const allowed = [
    'https://yahwehshouseofprayer.com',
    'http://yahwehshouseofprayer.com',
    'https://www.yahwehshouseofprayer.com'
  ];
  // Also allow Netlify preview URLs for testing
  const isNetlifyPreview = origin.includes('.netlify.app');
  if (!allowed.includes(origin) && !isNetlifyPreview) {
    return { statusCode: 403, body: 'Forbidden' };
  }

  // Get the API key from Netlify environment variable (never exposed to browser)
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: 'API key not configured' };
  }

  try {
    const body = JSON.parse(event.body);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: body.model || 'claude-sonnet-4-20250514',
        max_tokens: body.max_tokens || 1000,
        system: body.system || '',
        messages: body.messages || []
      })
    });

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify(data)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Proxy error: ' + err.message })
    };
  }
};

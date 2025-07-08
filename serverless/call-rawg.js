exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const RAWG_API_KEY = process.env.RAWG_API_KEY;
    const { path, params } = JSON.parse(event.body);

    // Baue die Query-Parameter zusammen (z.B. page_size=40, genres=indie, etc.)
    const queryParams = new URLSearchParams(params).toString();
    const API_URL = `https://api.rawg.io${path}?key=${RAWG_API_KEY}&${queryParams}`;
    
    const rawgResponse = await fetch(API_URL);

    if (!rawgResponse.ok) {
        const errorData = await rawgResponse.json();
        return { statusCode: rawgResponse.status, body: JSON.stringify(errorData) };
    }

    const responseData = await rawgResponse.json();

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(responseData)
    };

  } catch (error) {
    console.error('RAWG Serverless function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
};
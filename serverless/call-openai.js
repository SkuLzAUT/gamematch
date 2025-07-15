// in netlify/functions/call-openai.js
const fetch = require('node-fetch');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const requestBody = JSON.parse(event.body);

    // Wandelt das Gemini-Format ins OpenAI-Format um
    const messages = [
        { role: "system", content: requestBody.systemInstruction.parts[0].text }
    ];
    requestBody.contents.forEach(item => {
        messages.push({ role: item.role, content: item.parts[0].text });
    });

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: messages,
            response_format: { type: "json_object" }
        })
    });

    if (!openaiResponse.ok) {
        const errorData = await openaiResponse.json();
        console.error('OpenAI API Error:', errorData);
        return { statusCode: openaiResponse.status, body: JSON.stringify(errorData) };
    }

    const responseData = await openaiResponse.json();
    // OpenAI packt die Antwort anders ein, wir extrahieren sie hier.
    const openAIResultText = responseData.choices[0].message.content;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      // Wir geben die Antwort so zurück, als käme sie von Gemini, damit der Frontend-Code sie versteht.
      body: JSON.stringify({
          candidates: [{ content: { parts: [{ text: openAIResultText }] } }]
      })
    };

  } catch (error) {
    console.error('OpenAI Serverless function error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal Server Error' }) };
  }
};
// in netlify/functions/call-igdb.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } = process.env;
    const authUrl = `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;

    try {
        const authResponse = await fetch(authUrl, { method: 'POST' });
        if (!authResponse.ok) throw new Error(`Twitch Auth Error: ${authResponse.statusText}`);
        
        const authData = await authResponse.json();
        const accessToken = authData.access_token;

        const { query, endpoint = 'games' } = JSON.parse(event.body);
        const apiUrl = `https://api.igdb.com/v4/${endpoint}`;
        
        // WICHTIGE KORREKTUR:
        // Wir verwenden eine POST-Anfrage für alle Endpunkte, wie es von IGDB vorgesehen ist.
        // Der vorherige Fehler lag in einer fehlerhaften Annahme meinerseits.
        // Der 'query'-String selbst muss korrekt sein.
        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            },
            body: query
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            throw new Error(`IGDB API Error (${apiUrl}): ${apiResponse.statusText} - ${errorBody}`);
        }

        const responseData = await apiResponse.json();

        return {
            statusCode: 200,
            body: JSON.stringify(responseData)
        };

    } catch (error) {
        console.error('Error in call-igdb function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
// Wir benötigen node-fetch, um API-Anfragen vom Server aus zu machen.
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Greift sicher auf die in Netlify gespeicherten geheimen Schlüssel zu.
    const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } = process.env;

    // 1. Authentifizierung bei Twitch, um einen Access Token zu bekommen.
    // Dieser Token ist kurzlebig und wird für jede Anfrage neu geholt.
    const authUrl = `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;

    try {
        const authResponse = await fetch(authUrl, { method: 'POST' });
        if (!authResponse.ok) {
            // Wirft einen Fehler, wenn die Twitch-Authentifizierung fehlschlägt.
            throw new Error(`Twitch Auth Error: ${authResponse.statusText}`);
        }
        const authData = await authResponse.json();
        const accessToken = authData.access_token;

        // 2. Die eigentliche Anfrage an die IGDB API vorbereiten und stellen.
        // Holt sich die Such-Query und den gewünschten Endpunkt aus der Anfrage vom Frontend.
        // Standardmäßig wird der 'games'-Endpunkt verwendet.
        const { query, endpoint = 'games' } = JSON.parse(event.body);
        const apiUrl = `https://api.igdb.com/v4/${endpoint}`;

        const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            },
            body: query // Hier wird die APICalypse-Query aus dem Frontend übergeben.
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            throw new Error(`IGDB API Error: ${apiResponse.statusText} - ${errorBody}`);
        }

        const gameData = await apiResponse.json();

        // 3. Die erfolgreiche Antwort an das Frontend zurücksenden.
        return {
            statusCode: 200,
            body: JSON.stringify(gameData)
        };

    } catch (error) {
        // Bei einem Fehler wird eine klare Fehlermeldung geloggt und zurückgegeben.
        console.error('Error in call-igdb function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
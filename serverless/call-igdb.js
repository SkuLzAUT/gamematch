const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const { TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET } = process.env;

    // 1. Authentifizierung bei Twitch, um einen Access Token zu bekommen
    const authUrl = `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;

    try {
        const authResponse = await fetch(authUrl, { method: 'POST' });
        if (!authResponse.ok) {
            throw new Error(`Twitch Auth Error: ${authResponse.statusText}`);
        }
        const authData = await authResponse.json();
        const accessToken = authData.access_token;

        // 2. Die eigentliche Anfrage an die IGDB API stellen
        const { query } = JSON.parse(event.body);

        const apiResponse = await fetch('https://api.igdb.com/v4/games', {
            method: 'POST',
            headers: {
                'Client-ID': TWITCH_CLIENT_ID,
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            },
            body: query // Hier wird die APICalypse-Query übergeben
        });

        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            throw new Error(`IGDB API Error: ${apiResponse.statusText} - ${errorBody}`);
        }

        const gameData = await apiResponse.json();

        return {
            statusCode: 200,
            body: JSON.stringify(gameData)
        };

    } catch (error) {
        console.error('Error in call-igdb function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
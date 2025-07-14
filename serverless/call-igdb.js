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
        
        // ======================================================================
        // KORREKTUR: Wir passen die Anfrage an den Endpunkt an.
        // ======================================================================
        let apiResponse;

        // Für die meisten Anfragen (wie 'games') nutzen wir die normale POST-Methode.
        if (endpoint !== 'pulses/articles') { // Ein kleiner Trick, da 'pulses' selbst nicht direkt abfragbar ist
             apiResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Client-ID': TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                },
                body: query
            });
        }
        // HINWEIS: Eine direkte, komplexe News-Abfrage an IGDB ist bekanntermaßen schwierig.
        // Diese Funktion ist jetzt so gebaut, dass sie für 'games' und andere Standard-Endpunkte
        // funktioniert. Für eine robuste News-Integration ist oft eine Partnerschaft
        // oder eine andere News-API (z.B. Steam News API) der zuverlässigste Weg.
        // Wir lassen den News-Teil vorerst weg, um die Stabilität der Seite zu gewährleisten.

        if (!apiResponse || !apiResponse.ok) {
            const errorBody = apiResponse ? await apiResponse.text() : "No response from API";
            throw new Error(`IGDB API Error (${apiUrl}): ${apiResponse?.statusText || "Unknown Status"} - ${errorBody}`);
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
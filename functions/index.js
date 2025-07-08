// A modern import style for scheduled functions (v2)
const { onSchedule } = require("firebase-functions/v2/scheduler");

const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

// List of possible challenges
const challenges = [
    { type: "genre", value: "indie", text: "Lass dir heute ein Spiel mit dem Genre 'Indie' vorschlagen." },
    { type: "genre", value: "action", text: "Erhalte heute eine Empfehlung für ein 'Action'-Spiel." },
    { type: "genre", value: "rpg", text: "Finde heute dein nächstes 'RPG'-Abenteuer." },
    { type: "tag", value: "atmospheric", text: "Entdecke heute ein Spiel mit dem Tag 'atmospheric'." },
    { type: "tag", value: "story-rich", text: "Finde ein Spiel mit einer fesselnden Geschichte ('story-rich')." },
    { type: "tag", value: "singleplayer", text: "Lass dir heute ein reines 'Singleplayer'-Erlebnis vorschlagen." },
];

// This function will be executed every day at 05:00 AM
// This is the updated v2 syntax for scheduled functions
exports.generateDailyChallenge = onSchedule({
    schedule: "every day 05:00",
    timeZone: "Europe/Berlin",
}, async (event) => {
    console.log("Generating a new daily challenge...");

    // Select a random challenge from the list
    const selectedChallenge = challenges[Math.floor(Math.random() * challenges.length)];

    // Create a new object for Firestore to avoid modifying the original array
    const newChallengeData = {
        ...selectedChallenge,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Save the challenge to Firestore under a fixed document name
    try {
        await db.collection("dailyChallenge").doc("current").set(newChallengeData);
        console.log("New challenge successfully saved:", newChallengeData.text);
        return null;
    } catch (error) {
        console.error("Error saving the new challenge:", error);
        return null;
    }
});
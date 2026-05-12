const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();
const firestore = admin.firestore();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

exports.sendTelegramNotification = onDocumentCreated("orders/{orderId}", async (event) => {

    const snap = event.data;
    if (!snap) return;

    const order = snap.data();
    let userProfile = {};

    if (order.userId) {
        try {
            const userSnap = await firestore.collection("users").doc(order.userId).get();
            if (userSnap.exists) {
                userProfile = userSnap.data() || {};
            }
        } catch (error) {
            console.error("Error loading user profile for order notification:", error);
        }
    }

    const price = order.price ?? order.total ?? 0;
    const address = order.address || userProfile.address || 'N/A';
    const phone = order.phone || userProfile.phone || 'N/A';

    const message = `
🛒 New Order Received

👤 User: ${order.userName || 'N/A'}
📦 Product: ${order.productName || 'N/A'}
💰 Price: ₹${price}
📍 Address: ${address}
📞 Phone: ${phone}
`;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    try {
        await axios.post(url, {
            chat_id: CHAT_ID,
            text: message,
        });

        console.log("Telegram notification sent successfully");
    } catch (error) {
        console.error("Error sending Telegram notification:", error);
    }
});
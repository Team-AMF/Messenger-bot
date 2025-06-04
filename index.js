const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 8000;

// Facebook Webhook Verification Token & Page Access Token
const VERIFY_TOKEN = 'my-123';  // আপনার টোকেন এখানে দিন
const PAGE_ACCESS_TOKEN = 'EAAKVe2JRifQBOxWfMYSBGDTiO0iu5MK3BK8f8cMbbPerfcDG1BDn54KDTRVyLj9rnbT1ZBrpsjC2nrzf3ZAPQMT73j5BR8nFPV8hL7yqJXrmT1BvunKhEZB4rDDvX7SRZATcQMpOoxXra7ZBxsDyI4GZAw2K7vNZCIcx2qfUqBHL1xxIPSNZCDr76UWaiwjRMfHXePtZC6ThKPAZDZD';  // আপনার ফেসবুক পেজ অ্যাক্সেস টোকেন এখানে দিন

// OpenAI API Key (আপনার OpenAI API Key এখানে দিন)
const OPENAI_API_KEY = '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';  // OpenAI API Key এখানে দিন

// Webhook Verification Endpoint (GET)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('Webhook verified!');
            res.status(200).send(challenge);  // ফেসবুক Webhook ভেরিফাই করলে চ্যালেঞ্জ পাঠাবে
        } else {
            res.status(403).send('Verification failed');  // ভেরিফিকেশন ব্যর্থ হলে 403 ফেরত পাঠাবে
        }
    }
});

// Webhook to handle messages (POST)
app.post('/webhook', (req, res) => {
    const data = req.body;

    // Ensure this is a page subscription
    if (data.object === 'page') {
        data.entry.forEach((entry) => {
            const pageID = entry.id;
            const timeOfEvent = entry.time;

            entry.messaging.forEach((event) => {
                if (event.message) {
                    handleMessage(event.sender.id, event.message);
                }
            });
        });
        res.status(200).send('EVENT_RECEIVED');  // মেসেজ রিসিভ হলে সাড়া দেবে
    } else {
        res.sendStatus(404);  // যদি কোনো ত্রুটি থাকে
    }
});

// Function to handle incoming messages
async function handleMessage(senderID, receivedMessage) {
    let response;

    // If the message contains text, query OpenAI for a response
    if (receivedMessage.text) {
        try {
            // Make request to OpenAI API to get the response
            const openAIResponse = await axios.post(
                'https://api.openai.com/v1/completions',
                {
                    model: 'text-davinci-003',  // বা আপনার পছন্দমত মডেল
                    prompt: receivedMessage.text,
                    max_tokens: 100,
                    temperature: 0.7,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Extract the response text from OpenAI
            response = {
                text: openAIResponse.data.choices[0].text.trim(),
            };
        } catch (error) {
            console.error('OpenAI API Error:', error.message);
            response = { text: 'দুঃখিত, কিছু সমস্যা ঘটেছে। আমি উত্তর দিতে পারছি না।' };
        }
    } else {
        response = {
            text: "দুঃখিত, আমি এই ধরনের মেসেজ বুঝতে পারিনি।",
        };
    }

    // Call the Facebook Send API to reply
    callSendAPI(senderID, response);
}

// Function to send a message to Facebook user via Send API
function callSendAPI(senderID, response) {
    axios({
        method: 'post',
        url: `https://graph.facebook.com/v13.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
        data: {
            recipient: { id: senderID },
            message: response
        },
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(() => {
        console.log('Message sent successfully!');
    })
    .catch((error) => {
        console.error('Error sending message:', error);
    });
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

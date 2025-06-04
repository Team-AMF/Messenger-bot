const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();

const OPENAI_API_KEY = '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'; // আপনার OpenAI API কী দিন।
const PAGE_ACCESS_TOKEN = 'EAAKVe2JRifQBOxWfMYSBGDTiO0iu5MK3BK8f8cMbbPerfcDG1BDn54KDTRVyLj9rnbT1ZBrpsjC2nrzf3ZAPQMT73j5BR8nFPV8hL7yqJXrmT1BvunKhEZB4rDDvX7SRZATcQMpOoxXra7ZBxsDyI4GZAw2K7vNZCIcx2qfUqBHL1xxIPSNZCDr76UWaiwjRMfHXePtZC6ThKPAZDZD'; // আপনার ফেসবুক পেজ অ্যাক্সেস টোকেন

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// GPT-4 থেকে বাংলা ভাষায় উত্তর পাওয়ার ফাংশন
async function getGPTResponse(userMessage) {
    const apiEndpoint = 'https://api.openai.com/v1/completions';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
    };

    const data = {
        model: 'gpt-4', 
        prompt: `Answer the following question in Bengali: ${userMessage}`,
        max_tokens: 100,
        temperature: 0.7,
    };

    try {
        const response = await axios.post(apiEndpoint, data, { headers });
        return response.data.choices[0].text.trim();  // GPT-4 থেকে বাংলা উত্তর
    } catch (error) {
        console.error('Error getting GPT response:', error);
        throw error;
    }
}

// মেসেজ রিসিভ এবং পাঠানোর জন্য
app.post('/webhook', async (req, res) => {
    const data = req.body;

    if (data.object === 'page') {
        data.entry.forEach((entry) => {
            const webhookEvent = entry.messaging[0];
            const senderId = webhookEvent.sender.id;
            const message = webhookEvent.message.text;

            console.log(`Received message from user: ${senderId}`);
            console.log(`Message: ${message}`);

            // GPT-4 থেকে বাংলা উত্তর পাওয়ার জন্য কল করা হচ্ছে
            getGPTResponse(message)
                .then((gptResponse) => {
                    sendMessage(senderId, gptResponse);
                })
                .catch((error) => {
                    console.error('Error getting GPT response:', error);
                    sendMessage(senderId, 'দুঃখিত, আমি আপনার প্রশ্নটি বুঝতে পারিনি।');
                });
        });
        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// ফেসবুকে মেসেজ পাঠানো
function sendMessage(senderId, text) {
    const messageData = {
        recipient: { id: senderId },
        message: { text: text }
    };

    axios({
        method: 'post',
        url: `https://graph.facebook.com/v12.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
        data: messageData,
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        console.log('Message sent successfully', response.data);
    })
    .catch(error => {
        console.error('Error sending message:', error);
    });
}

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = 'm123'; // আপনি যা Facebook Webhook এ দিয়েছেন
const PAGE_ACCESS_TOKEN = 'EAAKVe2JRifQBOxWfMYSBGDTiO0iu5MK3BK8f8cMbbPerfcDG1BDn54KDTRVyLj9rnbT1ZBrpsjC2nrzf3ZAPQMT73j5BR8nFPV8hL7yqJXrmT1BvunKhEZB4rDDvX7SRZATcQMpOoxXra7ZBxsDyI4GZAw2K7vNZCIcx2qfUqBHL1xxIPSNZCDr76UWaiwjRMfHXePtZC6ThKPAZDZD'; // আপনার FB Page Token
const OPENAI_API_KEY = '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'; // OpenAI Key

// GET method for webhook verification
app.get('/api/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// POST method to handle messages
app.post('/api/webhook', async (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    for (const entry of body.entry) {
      for (const event of entry.messaging) {
        const senderId = event.sender.id;
        const messageText = event.message?.text;

        if (messageText) {
          const openaiResponse = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
              model: 'gpt-3.5-turbo',
              messages: [
                {
                  role: 'user',
                  content: `${messageText} এর উত্তর বাংলায় দাও`,
                },
              ],
            },
            {
              headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const replyText =
            openaiResponse.data.choices[0].message.content || 'আমি বুঝতে পারিনি।';

          await axios.post(
            `https://graph.facebook.com/v17.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
            {
              recipient: { id: senderId },
              message: { text: replyText },
            }
          );
        }
      }
    }

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

// Export the app (Vercel expects this for Express apps in `api`)
module.exports = app;

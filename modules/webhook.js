// webhook.js - Módulo separado do Webhook do HADABRA

const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const axios = require('axios');

router.use(bodyParser.json());

const VERIFY_TOKEN = "adegavm123";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Rota de verificação do Webhook (Meta API)
router.get('/', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    if (mode && token === VERIFY_TOKEN) {
        console.log("✅ Webhook verificado com sucesso.");
        res.status(200).send(challenge);
    } else {
        res.status(403).send('❌ Falha na verificação.');
    }
});

// ✅ Rota para processar mensagens do WhatsApp
router.post('/', async (req, res) => {
    try {
        const body = req.body;

        // Verifica se a mensagem recebida é do WhatsApp Business
        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry[0];
            const changes = entry.changes[0];
            const messageData = changes.value.messages ? changes.value.messages[0] : null;

            if (messageData) {
                const from = messageData.from; // Número do cliente
                let messageText = "";

                if (messageData.type === "text") {
                    messageText = messageData.text.body;
                } else if (messageData.type === "audio") {
                    const audioUrl = messageData.audio.url;

                    // 🔹 Baixar o áudio e transcrever usando Whisper
                    messageText = await transcreverAudio(audioUrl);
                }

                // 🔹 Processar mensagem com ChatGPT para definir o fluxo
                const respostaIA = await processarMensagemComIA(messageText);

                // 🔹 Enviar resposta para o cliente via WhatsApp
                await enviarRespostaWhatsApp(from, respostaIA);
            }

            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        console.error("❌ Erro ao processar mensagem:", error);
        res.sendStatus(500);
    }
});

// ✅ Função para transcrever áudios usando Whisper
async function transcreverAudio(audioUrl) {
    try {
        const response = await axios({
            method: "get",
            url: audioUrl,
            responseType: "arraybuffer"
        });

        const audioBuffer = response.data;
        const transcription = await openai.audio.transcriptions.create({
            model: "whisper-1",
            file: audioBuffer,
            language: "pt"
        });

        return transcription.text;
    } catch (error) {
        console.error("❌ Erro ao transcrever áudio:", error);
        return "Não foi possível entender o áudio.";
    }
}

// ✅ Função para processar mensagens com ChatGPT
async function processarMensagemComIA(mensagem) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Você é o HADABRA, um chatbot inteligente da VM Conveniência. Atenda pedidos, consulte estoque e processe pagamentos."
                },
                { role: "user", content: mensagem }
            ],
            temperature: 0.5
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("❌ Erro ao processar mensagem com ChatGPT:", error);
        return "Desculpe, houve um erro ao processar sua solicitação.";
    }
}

// ✅ Função para enviar resposta pelo WhatsApp
async function enviarRespostaWhatsApp(to, mensagem) {
    try {
        await axios.post(`https://graph.facebook.com/v17.0/${process.env.PHONE_NUMBER_ID}/messages`, {
            messaging_product: "whatsapp",
            to: to,
            text: { body: mensagem }
        }, {
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json"
            }
        });

        console.log("✅ Mensagem enviada com sucesso para:", to);
    } catch (error) {
        console.error("❌ Erro ao enviar mensagem no WhatsApp:", error);
    }
}

module.exports = router;

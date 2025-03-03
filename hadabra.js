// hadabra.js - Código principal do HADABRA com melhorias implementadas

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const OpenAI = require('openai');
const { processPayment } = require('./modules/payments');
const { processOrder } = require('./modules/order_flow');
const { atualizarEstoque } = require('./modules/stock_update');

const app = express();
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Rota principal de atendimento ao cliente
app.post('/webhook', async (req, res) => {
    const { message, from } = req.body;

    try {
        // 1️⃣ Enviar mensagem do usuário para o GPT-3.5
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Você é o HADABRA, um chatbot inteligente para VM Conveniência. Atenda pedidos, consulte estoque e processe pagamentos. Sempre sugira produtos automaticamente ao interpretar a intenção do cliente. Pergunte a quantidade antes de adicionar ao pedido. Não prometa rastreamento de entrega. Pagamentos via Mercado Pago devem ser confirmados automaticamente pelo webhook."
                },
                { role: "user", content: message }
            ],
            temperature: 0.5
        });

        const botReply = response.choices[0].message.content;
        
        res.json({ reply: botReply });
    } catch (error) {
        console.error("Erro no atendimento: ", error);
        res.status(500).json({ reply: "Ocorreu um erro no atendimento. Tente novamente." });
    }
});

// Rota de webhook para Mercado Pago
app.post('/webhook/mercadopago', async (req, res) => {
    await processPayment(req.body);
    res.sendStatus(200);
});

// Rota de processamento de pedidos
app.post('/pedido', async (req, res) => {
    const respostaPedido = await processOrder(req.body);
    res.json(respostaPedido);
});

// Rota de atualização de estoque
app.post('/estoque', async (req, res) => {
    const { usuario, entrada, tipo } = req.body;
    const respostaEstoque = await atualizarEstoque(usuario, entrada, tipo);
    res.json({ reply: respostaEstoque });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 HADABRA rodando na porta ${PORT}`);
});

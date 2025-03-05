// hadabra.js - Código principal do HADABRA

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const OpenAI = require('openai');
const { processPayment } = require('./modules/payments');
const { processOrder } = require('./modules/order_flow');
const { atualizarEstoque } = require('./modules/stock_update');
const webhook = require('./webhook'); // 🔹 Importando o módulo do webhook

const app = express();
app.use(bodyParser.json());

// ✅ Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// ✅ Middleware para gerenciar requisições do webhook
app.use('/webhook', webhook);

// ✅ Rota de webhook do Mercado Pago
app.post('/webhook/mercadopago', async (req, res) => {
    await processPayment(req.body);
    res.sendStatus(200);
});

// ✅ Rota de processamento de pedidos
app.post('/pedido', async (req, res) => {
    const respostaPedido = await processOrder(req.body);
    res.json(respostaPedido);
});

// ✅ Rota de atualização de estoque
app.post('/estoque', async (req, res) => {
    const { usuario, entrada, tipo } = req.body;
    const respostaEstoque = await atualizarEstoque(usuario, entrada, tipo);
    res.json({ reply: respostaEstoque });
});

// ✅ Inicializar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 HADABRA rodando na porta ${PORT} e aguardando conexões`);
});

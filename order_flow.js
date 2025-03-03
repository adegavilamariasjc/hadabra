// modules/order_flow.js - Fluxo de atendimento e pedidos

const mongoose = require('mongoose');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Modelo de Pedidos
const PedidoSchema = new mongoose.Schema({
    pedido_id: String,
    cliente: String,
    itens: [{ nome: String, quantidade: Number, preco: Number }],
    total: Number,
    status: String,
    data_pedido: { type: Date, default: Date.now }
});

const Pedido = mongoose.model('Pedido', PedidoSchema);

// Função para processar pedidos
async function processOrder(orderData) {
    try {
        const { cliente, mensagem } = orderData;

        // Interpretação do pedido com GPT-3.5
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Você é um assistente de pedidos inteligente. Sempre sugira produtos do estoque assim que interpretar a intenção do cliente. Pergunte sempre a quantidade antes de adicionar ao pedido."
                },
                { role: "user", content: mensagem }
            ],
            temperature: 0.5
        });

        const respostaGPT = response.choices[0].message.content;
        
        return { reply: respostaGPT };
    } catch (error) {
        console.error("Erro ao processar pedido:", error);
        return { reply: "Ocorreu um erro ao processar seu pedido. Tente novamente." };
    }
}

module.exports = { processOrder };

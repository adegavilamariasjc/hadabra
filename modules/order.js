// modules/orders.js - Módulo de gerenciamento de pedidos

const mongoose = require('mongoose');
const OpenAI = require('openai');
const { checkStock, updateStock } = require('./stock');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Modelo de Pedido
const OrderSchema = new mongoose.Schema({
    cliente_id: String,
    produtos: [{ nome: String, quantidade: Number, preco_unitario: Number }],
    total: Number,
    status: { type: String, default: 'Pendente' },
    data_criacao: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', OrderSchema);

async function handleOrder(cliente, mensagem) {
    try {
        // Verificar contexto do pedido com IA
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: mensagem }],
            temperature: 0.7
        });

        const pedidoProcessado = response.choices[0].message.content;
        
        // Validar estoque
        const produtos = JSON.parse(pedidoProcessado);
        let total = 0;

        for (const item of produtos) {
            const estoqueDisponivel = await checkStock(item.nome);
            if (estoqueDisponivel < item.quantidade) {
                return `Desculpe, temos apenas ${estoqueDisponivel} unidades de ${item.nome} disponíveis.`;
            }
            total += item.quantidade * item.preco_unitario;
        }

        // Criar pedido no banco de dados
        const novoPedido = new Order({
            cliente_id: cliente,
            produtos,
            total,
            status: "Aguardando Pagamento"
        });

        await novoPedido.save();

        // Atualizar estoque
        for (const item of produtos) {
            await updateStock(item.nome, -item.quantidade);
        }

        return `Pedido registrado! Total: R$ ${total.toFixed(2)}. Escolha sua forma de pagamento.`;
    } catch (error) {
        console.error("Erro ao processar pedido:", error);
        return "Houve um erro ao processar seu pedido. Tente novamente.";
    }
}

module.exports = { handleOrder };

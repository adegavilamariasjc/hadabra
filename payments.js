// modules/payments.js - Processamento de pagamentos via Mercado Pago

const axios = require('axios');
const mongoose = require('mongoose');

// Modelo de Pedidos
const PedidoSchema = new mongoose.Schema({
    pedido_id: String,
    status_pagamento: String,
    total: Number,
    cliente: String,
    data_pedido: { type: Date, default: Date.now }
});

const Pedido = mongoose.model('Pedido', PedidoSchema);

// Função para processar pagamentos via webhook do Mercado Pago
async function processPayment(paymentData) {
    try {
        const { pedido_id, status_pagamento } = paymentData;

        let pedido = await Pedido.findOne({ pedido_id });
        if (!pedido) {
            console.error("Pedido não encontrado no banco de dados.");
            return;
        }

        pedido.status_pagamento = status_pagamento;
        await pedido.save();

        if (status_pagamento === 'aprovado') {
            console.log(`✅ Pagamento confirmado para o Pedido #${pedido_id}`);
            // Aqui podemos acionar um webhook para notificar o cliente via WhatsApp
        } else {
            console.log(`❌ Pagamento não aprovado para o Pedido #${pedido_id}`);
        }
    } catch (error) {
        console.error("Erro ao processar pagamento:", error);
    }
}

module.exports = { processPayment };

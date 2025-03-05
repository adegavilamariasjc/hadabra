// modules/reports.js - Relatórios de vendas

const mongoose = require('mongoose');

const Order = mongoose.model('Order');

async function generateDailyReport() {
    try {
        const dataInicio = new Date();
        dataInicio.setHours(0, 0, 0, 0);

        const pedidos = await Order.find({ data_criacao: { $gte: dataInicio } });

        let totalVendas = 0;
        let produtosVendidos = {};

        pedidos.forEach(pedido => {
            totalVendas += pedido.total;
            pedido.produtos.forEach(item => {
                produtosVendidos[item.nome] = (produtosVendidos[item.nome] || 0) + item.quantidade;
            });
        });

        return {
            totalVendas: totalVendas.toFixed(2),
            pedidosRealizados: pedidos.length,
            produtosMaisVendidos: Object.entries(produtosVendidos).map(([nome, quantidade]) => ({ nome, quantidade }))
        };
    } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        return "Erro ao gerar relatório.";
    }
}

module.exports = { generateDailyReport };

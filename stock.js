// modules/stock.js - Módulo de gerenciamento de estoque

const mongoose = require('mongoose');

const StockSchema = new mongoose.Schema({
    nome: String,
    quantidade: Number,
    preco_venda: Number,
    preco_compra: Number,
    quantidade_minima: Number
});

const Stock = mongoose.model('Stock', StockSchema);

async function checkStock(produtoNome) {
    const produto = await Stock.findOne({ nome: produtoNome });
    return produto ? produto.quantidade : 0;
}

async function updateStock(produtoNome, quantidade) {
    const produto = await Stock.findOne({ nome: produtoNome });
    if (produto) {
        produto.quantidade += quantidade;
        await produto.save();
    }
}

module.exports = { checkStock, updateStock };

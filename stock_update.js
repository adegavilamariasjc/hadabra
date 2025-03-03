// modules/stock_update.js - Atualização de estoque via áudio e texto

const mongoose = require('mongoose');
const OpenAI = require('openai');
const { processAudio } = require('./whisper');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Modelo de Estoque
const StockSchema = new mongoose.Schema({
    nome: String,
    categoria: String,
    quantidade: Number,
    preco_compra: Number,
    preco_venda: Number,
    atualizado_por: String,
    data_atualizacao: { type: Date, default: Date.now }
});

const Stock = mongoose.model('Stock', StockSchema);

// Função para processar atualização de estoque via áudio ou texto
async function atualizarEstoque(usuario, entrada, tipo) {
    try {
        let textoProcessado = entrada;

        // Se for áudio, processa com Whisper
        if (tipo === 'audio') {
            textoProcessado = await processAudio(entrada);
        }

        // 1️⃣ Utilizar GPT-3.5 para interpretar os dados
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: `Interprete esta mensagem e extraia informações para atualizar estoque: ${textoProcessado}` }],
            temperature: 0.5
        });
        
        const dadosExtraidos = JSON.parse(response.choices[0].message.content);
        
        // 2️⃣ Verificar se todos os dados foram extraídos corretamente
        if (!dadosExtraidos.nome || !dadosExtraidos.quantidade || !dadosExtraidos.preco_compra || !dadosExtraidos.preco_venda || !dadosExtraidos.categoria) {
            return `❌ Algumas informações estão faltando. Verifique e tente novamente.`;
        }

        // 3️⃣ Atualizar estoque no MongoDB
        let produto = await Stock.findOne({ nome: dadosExtraidos.nome });

        if (produto) {
            produto.quantidade += dadosExtraidos.quantidade;
            produto.preco_compra = dadosExtraidos.preco_compra;
            produto.preco_venda = dadosExtraidos.preco_venda;
            produto.atualizado_por = usuario;
            produto.data_atualizacao = new Date();
            await produto.save();
        } else {
            produto = new Stock({
                nome: dadosExtraidos.nome,
                categoria: dadosExtraidos.categoria,
                quantidade: dadosExtraidos.quantidade,
                preco_compra: dadosExtraidos.preco_compra,
                preco_venda: dadosExtraidos.preco_venda,
                atualizado_por: usuario
            });
            await produto.save();
        }
        
        // 4️⃣ Confirmar atualização para o gerente
        return `✅ Estoque atualizado!
📦 Produto: ${dadosExtraidos.nome} (${dadosExtraidos.categoria})
📥 Entrada: +${dadosExtraidos.quantidade} unidades
💰 Preço de Compra: R$ ${dadosExtraidos.preco_compra.toFixed(2)}
🏷️ Preço de Venda: R$ ${dadosExtraidos.preco_venda.toFixed(2)}
🛠️ Atualizado por: ${usuario}`;
    } catch (error) {
        console.error('❌ Erro ao atualizar estoque:', error);
        return '❌ Erro ao processar atualização de estoque. Tente novamente.';
    }
}

module.exports = { atualizarEstoque };

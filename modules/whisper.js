// modules/whisper.js - Processamento de áudio com Whisper

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function processAudio(audioUrl) {
    try {
        const audioData = await axios.get(audioUrl, { responseType: 'stream' });
        const formData = new FormData();
        formData.append('file', audioData.data, { filename: 'audio.ogg' });

        const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                ...formData.getHeaders()
            }
        });

        return response.data.text;
    } catch (error) {
        console.error('Erro ao processar áudio:', error);
        return 'Erro ao transcrever áudio.';
    }
}

module.exports = { processAudio };

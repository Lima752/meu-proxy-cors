// Ficheiro: api/proxy.js
// Este é o nosso novo backend

// Importa o CryptoJS para o servidor
const CryptoJS = require('crypto-js');

// O 'handler' é a função que a Vercel irá executar
module.exports = async (request, response) => {
    try {
        // 1. Pega o deviceId que o nosso painel enviou (ex: ?id=eb798...)
        const { id } = request.query;
        if (!id) {
            return response.status(400).json({ success: false, msg: "Device ID é obrigatório." });
        }

        // 2. Pega as chaves de segurança que guardámos na Vercel
        const clientId = process.env.TUYA_CLIENT_ID;
        const secret = process.env.TUYA_CLIENT_SECRET;
        const baseUrl = "https://openapi.tuyaus.com";

        // 3. Constrói a chamada para a Tuya (igual ao nosso teste bem-sucedido)
        const method = "GET";
        const t = Date.now().toString();
        const path = `/v1.0/devices/${id}/status`;
        const body = "";
        const contentHash = CryptoJS.SHA256(body).toString(CryptoJS.enc.Hex);
        const stringToSign = `${method}\n${contentHash}\n\n${path}`;
        const sign = CryptoJS.HmacSHA256(stringToSign, secret).toString(CryptoJS.enc.Hex).toUpperCase();
        
        const headers = {
            'client_id': clientId,
            'sign': sign,
            't': t,
            'sign_method': 'HMAC-SHA256'
        };
        
        const url = baseUrl + path;

        // 4. O Servidor faz a chamada (sem problemas de CORS)
        const tuyaResponse = await fetch(url, { method, headers });
        const data = await tuyaResponse.json();

        // 5. Permite que o nosso site GitHub receba a resposta (Controlo de CORS)
        response.setHeader('Access-Control-Allow-Origin', 'https://hoebsalas.github.io');
        response.setHeader('Access-Control-Allow-Methods', 'GET');
        response.setHeader('Cache-Control', 'no-cache'); // Sem cache!

        // 6. Envia os dados da Tuya de volta para o painel
        response.status(200).json(data);

    } catch (error) {
        response.status(500).json({ success: false, msg: error.message });
    }
};

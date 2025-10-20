// Ficheiro: api/proxy.js
// VERSÃO FINAL CORRIGIDA - Usa o endpoint v2.0 que funciona

const CryptoJS = require('crypto-js');

module.exports = async (request, response) => {
    // Estas 3 linhas permitem que o seu painel receba a resposta
    response.setHeader('Access-Control-Allow-Origin', 'https://hoebsalas.github.io');
    response.setHeader('Access-Control-Allow-Methods', 'GET');
    response.setHeader('Cache-Control', 'no-cache');

    try {
        const { id } = request.query;
        if (!id) {
            return response.status(400).json({ success: false, msg: "Device ID é obrigatório." });
        }

        // Usamos as chaves seguras que estão na Vercel
        const clientId = "8y9cawst5km45canysuq";
        const secret = "2cabe1ab28674f1f9b10376baf22e94f";
        const baseUrl = "https://openapi.tuyaus.com";
        const t = Date.now().toString();

        // PASSO 1: Obter o "bilhete de entrada" (Access Token)
        const tokenMethod = "GET";
        const tokenPath = "/v1.0/token?grant_type=1";
        const tokenStringToSign = clientId + t;
        const tokenSign = CryptoJS.HmacSHA256(tokenStringToSign, secret).toString(CryptoJS.enc.Hex).toUpperCase();

        const tokenHeaders = { 'client_id': clientId, 'sign': tokenSign, 't': t, 'sign_method': 'HMAC-SHA256' };
        const tokenResponse = await fetch(baseUrl + tokenPath, { method: tokenMethod, headers: tokenHeaders });
        const tokenData = await tokenResponse.json();

        if (!tokenData.success) {
            // Se falhar aqui, o problema é na autenticação inicial
            return response.status(401).json(tokenData);
        }

        const accessToken = tokenData.result.access_token;

        // PASSO 2: Usar o bilhete para pedir os dados do sensor (no endpoint correto)
        const statusMethod = "GET";
        const statusPath = `/v2.0/cloud/thing/${id}/shadow/properties`; // O endpoint que funcionou no seu teste!

        const statusStringToSign = clientId + accessToken + t + statusMethod + '\n' + CryptoJS.SHA256('').toString(CryptoJS.enc.Hex) + '\n\n' + statusPath;
        const statusSign = CryptoJS.HmacSHA256(statusStringToSign, secret).toString(CryptoJS.enc.Hex).toUpperCase();

        const statusHeaders = {
            'client_id': clientId, 'sign': statusSign, 't': t, 'access_token': accessToken, 'sign_method': 'HMAC-SHA256'
        };

        const statusResponse = await fetch(baseUrl + statusPath, { method: statusMethod, headers: statusHeaders });
        const statusData = await statusResponse.json();

        // Envia a resposta final para o seu painel
        response.status(200).json(statusData);

    } catch (error) {
        // Se algo der muito errado, envia um erro genérico
        response.status(500).json({ success: false, msg: error.message });
    }
};

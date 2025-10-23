// Ficheiro: api/proxy.js
// VERSÃO FINAL - Usando as credenciais confirmadas pelo usuário (...1087...)

const CryptoJS = require('crypto-js');
// const fetch = require('node-fetch'); // Descomente se der erro 'fetch is not defined'

module.exports = async (request, response) => {
    // Headers de CORS e Preflight
    response.setHeader('Access-Control-Allow-Origin', 'https://hoebsalas.github.io');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
    response.setHeader('Cache-Control', 'no-cache');

    // Responde ao pedido OPTIONS (preflight) imediatamente
    if (request.method === 'OPTIONS') {
       return response.status(200).end();
    }

    console.log("--- INICIANDO REQUISIÇÃO (Credenciais Confirmadas) ---");

    try {
        const { id } = request.query;
        if (!id) { return response.status(400).json({ success: false, msg: "Device ID é obrigatório." }); }

        // ===== CREDENCIAIS CONFIRMADAS PELO USUÁRIO =====
        const clientId = "8y9cawst5kr45canysuq";
        const secret = "2cabe1ab28674f1f9b10876baf22e94f"; // Usando o secret confirmado
        // ===========================================
        const baseUrl = "https://openapi.tuyaus.com";
        const t = Date.now().toString();

        // ===== PASSO 1: OBTER O ACCESS TOKEN (Assinatura SIMPLES e Header CORRETO) =====
        const tokenMethod = "GET";
        const tokenPath = "/v1.0/token?grant_type=1";

        const tokenStringToSign = clientId + t; // Assinatura simples
        const tokenSign = CryptoJS.HmacSHA256(tokenStringToSign, secret).toString(CryptoJS.enc.Hex).toUpperCase();

        const tokenHeaders = {
            'client_id': clientId,
            'sign': tokenSign,
            't': t,
            'sign_method': 'HMAC-SHA256',
            'Signature-Headers': '' // Cabeçalho vazio crucial
        };

        console.log("Token - URL:", baseUrl + tokenPath);
        console.log("Token - String Assinada (SIMPLES):", tokenStringToSign);
        console.log("Token - Headers:", JSON.stringify(tokenHeaders));

        const tokenResponse = await fetch(baseUrl + tokenPath, { method: tokenMethod, headers: tokenHeaders });
        const tokenData = await tokenResponse.json();
        console.log("Token - Resposta:", JSON.stringify(tokenData));

        if (!tokenData.success) {
            console.error("Falha ao obter Access Token:", tokenData);
            return response.status(tokenResponse.status).json(tokenData);
        }

        const accessToken = tokenData.result.access_token;

        // ===== PASSO 2: OBTER OS DADOS DO SENSOR (Assinatura Complexa - CORRETA) =====
        const statusMethod = "GET";
        const statusPath = `/v2.0/cloud/thing/${id}/shadow/properties`; // Endpoint v2.0
        const statusBody = "";
        const statusContentHash = CryptoJS.SHA256(statusBody).toString(CryptoJS.enc.Hex);

        // Assinatura complexa para chamada com token
        const statusStringToSign = clientId + accessToken + t + statusMethod + '\n' + statusContentHash + '\n\n' + statusPath;
        const statusSign = CryptoJS.HmacSHA256(statusStringToSign, secret).toString(CryptoJS.enc.Hex).toUpperCase();

        const statusHeaders = {
            'client_id': clientId, 'sign': statusSign, 't': t, 'access_token': accessToken, 'sign_method': 'HMAC-SHA256'
        };

        console.log("\nStatus - URL:", baseUrl + statusPath);
        // console.log("Status - String Assinada:", statusStringToSign.replace(/\n/g, '\\n'));
        // console.log("Status - Headers:", JSON.stringify(statusHeaders));

        const statusResponse = await fetch(baseUrl + statusPath, { method: statusMethod, headers: statusHeaders });
        const statusData = await statusResponse.json();
        console.log("Status - Resposta:", JSON.stringify(statusData));

        response.status(200).json(statusData);

    } catch (error) {
        console.error("Erro Crítico no Servidor:", error);
        response.status(500).json({ success: false, msg: error.message });
    }
};

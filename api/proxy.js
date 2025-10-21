// Ficheiro: api/proxy.js
// VERSÃO FINAL CORRIGIDA - Assinatura do Token corrigida

const CryptoJS = require('crypto-js');

module.exports = async (request, response) => {
    // Headers de CORS
    response.setHeader('Access-Control-Allow-Origin', 'https://hoebsalas.github.io');
    response.setHeader('Access-Control-Allow-Methods', 'GET');
    response.setHeader('Cache-Control', 'no-cache');
    
    if (request.method === 'OPTIONS') {
       response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
       return response.status(200).end();
    }

    console.log("--- INICIANDO REQUISIÇÃO (Assinatura Corrigida) ---");

    try {
        const { id } = request.query;
        if (!id) { return response.status(400).json({ success: false, msg: "Device ID é obrigatório." }); }

        // Chaves Hardcoded para teste final
        const clientId = "8y9cawst5km45canysuq";
        const secret = "2cabe1ab28674f1f9b10376baf22e94f";
        const baseUrl = "https://openapi.tuyaus.com";
        const t = Date.now().toString();
        
        // ===== PASSO 1: OBTER O ACCESS TOKEN (Assinatura CORRIGIDA) =====
        const tokenMethod = "GET";
        const tokenPath = "/v1.0/token?grant_type=1";
        const tokenBody = "";
        const tokenContentHash = CryptoJS.SHA256(tokenBody).toString(CryptoJS.enc.Hex);
        // A assinatura para o token TAMBÉM usa o formato complexo
        const tokenStringToSign = `${tokenMethod}\n${tokenContentHash}\n\n${tokenPath}`; 
        const tokenSign = CryptoJS.HmacSHA256(tokenStringToSign, secret).toString(CryptoJS.enc.Hex).toUpperCase();
        
        const tokenHeaders = {
            'client_id': clientId, 'sign': tokenSign, 't': t, 'sign_method': 'HMAC-SHA256'
        };

        const tokenUrl = baseUrl + tokenPath;
        const tokenResponse = await fetch(tokenUrl, { method: tokenMethod, headers: tokenHeaders });
        const tokenData = await tokenResponse.json();

        if (!tokenData.success) {
            console.error("Falha ao obter Access Token:", tokenData); // Log completo do erro
            return response.status(401).json(tokenData);
        }
        
        const accessToken = tokenData.result.access_token;

        // ===== PASSO 2: OBTER OS DADOS DO SENSOR (Já estava correto) =====
        const statusMethod = "GET";
        const statusPath = `/v2.0/cloud/thing/${id}/shadow/properties`;
        const statusBody = "";
        const statusContentHash = CryptoJS.SHA256(statusBody).toString(CryptoJS.enc.Hex);
        
        const statusStringToSign = clientId + accessToken + t + statusMethod + '\n' + statusContentHash + '\n\n' + statusPath;
        const statusSign = CryptoJS.HmacSHA256(statusStringToSign, secret).toString(CryptoJS.enc.Hex).toUpperCase();

        const statusHeaders = {
            'client_id': clientId, 'sign': statusSign, 't': t, 'access_token': accessToken, 'sign_method': 'HMAC-SHA256'
        };

        const statusUrl = baseUrl + statusPath;
        const statusResponse = await fetch(statusUrl, { method: statusMethod, headers: statusHeaders });
        const statusData = await statusResponse.json();
        
        response.status(200).json(statusData);

    } catch (error) {
        console.error("Erro Crítico no Servidor:", error);
        response.status(500).json({ success: false, msg: error.message });
    }
};

// Ficheiro: api/proxy.js
// VERSÃO FINAL DE TESTE - Com chaves 'Hardcoded' para diagnóstico

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

    console.log("--- INICIANDO REQUISIÇÃO (HARDCODED TEST) ---");

    try {
        const { id } = request.query;
        console.log("Device ID recebido:", id);
        if (!id) {
            console.error("Erro: Device ID não fornecido.");
            return response.status(400).json({ success: false, msg: "Device ID é obrigatório." });
        }

        // ===== CHAVES HARDCODED DIRETAMENTE =====
        const clientId = "8y9cawst5km45canysuq";
        const secret = "2cabe1ab28674f1f9b10376baf22e94f";
        // =====================================

        const baseUrl = "https://openapi.tuyaus.com";
        const t = Date.now().toString();
        console.log("Timestamp (t):", t);
        console.log("Client ID (Hardcoded):", clientId);

        // ===== PASSO 1: OBTER O ACCESS TOKEN =====
        console.log("\n--- PASSO 1: Obtendo Access Token ---");
        const tokenMethod = "GET";
        const tokenPath = "/v1.0/token?grant_type=1";
        const tokenStringToSign = clientId + t; 
        console.log("Token - String para Assinar:", tokenStringToSign);
        const tokenSign = CryptoJS.HmacSHA256(tokenStringToSign, secret).toString(CryptoJS.enc.Hex).toUpperCase();
        console.log("Token - Assinatura (Sign):", tokenSign);
        
        const tokenHeaders = {
            'client_id': clientId, 'sign': tokenSign, 't': t, 'sign_method': 'HMAC-SHA256'
        };
        console.log("Token - Headers enviados:", JSON.stringify(tokenHeaders));

        const tokenUrl = baseUrl + tokenPath;
        console.log("Token - URL:", tokenUrl);
        const tokenResponse = await fetch(tokenUrl, { method: tokenMethod, headers: tokenHeaders });
        console.log("Token - Status da Resposta HTTP:", tokenResponse.status);
        const tokenData = await tokenResponse.json();
        console.log("Token - Resposta JSON:", JSON.stringify(tokenData));

        if (!tokenData.success) {
            console.error("Falha ao obter o Access Token:", tokenData.msg);
            return response.status(401).json(tokenData); // Retorna o erro específico da Tuya
        }
        
        const accessToken = tokenData.result.access_token;
        console.log("Access Token obtido:", accessToken ? accessToken.substring(0, 5) + '...' : 'ERRO'); 

        // ===== PASSO 2: OBTER OS DADOS DO SENSOR =====
        console.log("\n--- PASSO 2: Obtendo Status do Sensor ---");
        const statusMethod = "GET";
        const statusPath = `/v2.0/cloud/thing/${id}/shadow/properties`; 
        const statusBody = "";
        const statusContentHash = CryptoJS.SHA256(statusBody).toString(CryptoJS.enc.Hex);
        
        const statusStringToSign = clientId + accessToken + t + statusMethod + '\n' + statusContentHash + '\n\n' + statusPath;
        console.log("Status - String para Assinar:", statusStringToSign.replace(/\n/g, '\\n'));
        const statusSign = CryptoJS.HmacSHA256(statusStringToSign, secret).toString(CryptoJS.enc.Hex).toUpperCase();
        console.log("Status - Assinatura (Sign):", statusSign);

        const statusHeaders = {
            'client_id': clientId, 'sign': statusSign, 't': t, 'access_token': accessToken, 'sign_method': 'HMAC-SHA256'
        };
        console.log("Status - Headers enviados:", JSON.stringify(statusHeaders));

        const statusUrl = baseUrl + statusPath;
        console.log("Status - URL:", statusUrl);
        const statusResponse = await fetch(statusUrl, { method: statusMethod, headers: statusHeaders });
        console.log("Status - Status da Resposta HTTP:", statusResponse.status);
        const statusData = await statusResponse.json();
        console.log("Status - Resposta JSON final:", JSON.stringify(statusData));
        
        console.log("\n--- REQUISIÇÃO CONCLUÍDA ---");
        response.status(200).json(statusData);

    } catch (error) {
        console.error("\n--- ERRO CRÍTICO NO SERVIDOR ---", error);
        response.status(500).json({ success: false, msg: error.message });
    }
};

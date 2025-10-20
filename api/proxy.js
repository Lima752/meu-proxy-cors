// Ficheiro: api/proxy.js
// VERSÃO FINAL - Com autenticação de Access Token

const CryptoJS = require('crypto-js');

module.exports = async (request, response) => {
    // Permite que o nosso site GitHub receba a resposta
    response.setHeader('Access-Control-Allow-Origin', 'https://hoebsalas.github.io');
    response.setHeader('Access-Control-Allow-Methods', 'GET');
    response.setHeader('Cache-Control', 'no-cache');

    try {
        const { id } = request.query;
        if (!id) {
            return response.status(400).json({ success: false, msg: "Device ID é obrigatório." });
        }

        const clientId = process.env.TUYA_CLIENT_ID;
        const secret = process.env.TUYA_CLIENT_SECRET;
        const baseUrl = "https://openapi.tuyaus.com";
        const t = Date.now().toString();

        // ===== PASSO 1: OBTER O ACCESS TOKEN =====
        const tokenMethod = "GET";
        const tokenPath = "/v1.0/token?grant_type=1";
        const tokenStringToSign = `${clientId}${t}${tokenMethod}\n${CryptoJS.SHA256('').toString(CryptoJS.enc.Hex)}\n\n${tokenPath}`;
        const tokenSign = CryptoJS.HmacSHA256(tokenStringToSign, secret).toString(CryptoJS.enc.Hex).toUpperCase();
        
        const tokenHeaders = {
            'client_id': clientId,
            'sign': tokenSign,
            't': t,
            'sign_method': 'HMAC-SHA256',
            'login_type': 'PULSE' // Necessário para este tipo de autenticação
        };

        const tokenResponse = await fetch(baseUrl + tokenPath, { method: tokenMethod, headers: tokenHeaders });
        const tokenData = await tokenResponse.json();

        if (!tokenData.success) {
            // Se falhar ao obter o token, devolve o erro da Tuya
            return response.status(401).json(tokenData);
        }
        
        const accessToken = tokenData.result.access_token;

        // ===== PASSO 2: USAR O ACCESS TOKEN PARA OBTER OS DADOS DO SENSOR =====
        const statusMethod = "GET";
        const statusPath = `/v1.0/devices/${id}/status`;
        const statusStringToSign = `${clientId}${accessToken}${t}${statusMethod}\n${CryptoJS.SHA256('').toString(CryptoJS.enc.Hex)}\n\n${statusPath}`;
        const statusSign = CryptoJS.HmacSHA256(statusStringToSign, secret).toString(CryptoJS.enc.Hex).toUpperCase();

        const statusHeaders = {
            'client_id': clientId,
            'sign': statusSign,
            't': t,
            'access_token': accessToken,
            'sign_method': 'HMAC-SHA256'
        };

        const statusResponse = await fetch(baseUrl + statusPath, { method: statusMethod, headers: statusHeaders });
        const statusData = await statusResponse.json();
        
        // Envia a resposta final para o painel
        response.status(200).json(statusData);

    } catch (error) {
        response.status(500).json({ success: false, msg: error.message });
    }
};

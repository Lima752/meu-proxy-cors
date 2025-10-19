// Carrega o módulo cors-anywhere
const cors_proxy = require('cors-anywhere');

// Configurações do proxy
const host = '0.0.0.0';
const port = process.env.PORT || 8080;

// Cria e inicia o servidor proxy
cors_proxy.createServer({
    originWhitelist: [], // Permite todos os origins
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, () => {
    console.log('Running CORS Anywhere on ' + host + ':' + port);
});

const localtunnel = require('localtunnel');
(async () => {
  const tunnel = await localtunnel({ port: 3000, subdomain: 'lb-digital-webhook-50' });
  console.log('TUNNEL_URL:', tunnel.url);
  tunnel.on('close', () => {
    console.log('Tunnel closed');
  });
})();

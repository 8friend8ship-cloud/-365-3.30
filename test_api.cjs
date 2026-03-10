const https = require('https');
https.get('https://getbible.net/json?passage=Prov1:1&v=korean', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.slice(0, 100)));
});

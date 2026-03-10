const https = require('https');
const fs = require('fs');

const url = 'https://raw.githubusercontent.com/yesu-io/bible-json/main/ko_krv.json'; // Maybe this?
https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(data.slice(0, 100));
  });
});

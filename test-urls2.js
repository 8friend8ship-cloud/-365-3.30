import https from 'https';

const url = 'https://drive.usercontent.google.com/download?id=1zjcKo8VV52USh-fMpv8IfxYfNuUQKovS&export=download';

https.get(url, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
}).on('error', (e) => {
  console.error(e);
});

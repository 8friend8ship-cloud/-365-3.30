import fs from 'fs';
import https from 'https';

const id = '1zjcKo8VV52USh-fMpv8IfxYfNuUQKovS';
const urls = [
  `https://drive.google.com/uc?export=download&id=${id}`,
  `https://docs.google.com/uc?export=download&id=${id}`,
  `https://drive.google.com/uc?export=view&id=${id}`,
  `https://docs.google.com/uc?export=open&id=${id}`
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log(`URL: ${url}`);
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      console.log('---');
      resolve();
    }).on('error', (e) => {
      console.error(e);
      resolve();
    });
  });
}

async function run() {
  for (const url of urls) {
    await checkUrl(url);
  }
}

run();

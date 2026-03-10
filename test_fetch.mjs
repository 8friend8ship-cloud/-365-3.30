import fetch from 'node-fetch';

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzMNeTPcLIktMPqzkJnVH4tJG_fZNt6821LQDwJtaBAkr5sYCjpFX_LFS_bBsDJwHne/exec';
const SPREADSHEET_ID = '1qHteZrNUa3ln2lix3p1Bufsh1o6WN98Ogoy9acuTlBg';
const ACCESS_TOKEN = 'bible2026secret';
const EDITOR_ID = '109430604282542310163';

async function run() {
  const url = new URL(WEBAPP_URL);
  url.searchParams.set('type', 'today');
  url.searchParams.set('token', ACCESS_TOKEN);
  url.searchParams.set('spreadsheetId', SPREADSHEET_ID);
  url.searchParams.set('editorId', EDITOR_ID);
  url.searchParams.set('t', Date.now().toString());

  console.log('Fetching:', url.toString());
  
  const res = await fetch(url.toString());
  const data = await res.json();
  
  console.log('Success:', data.success);
  if (data.items && data.items.length > 0) {
    const item = data.items[0];
    console.log('ID:', item.id);
    console.log('audio:', item.audio);
    console.log('audioFileIds:', item.audioFileIds);
    console.log('audioWebApp:', item.audioWebApp);
    console.log('audioJson:', item.audioJson);
    console.log('status:', item.status);
  } else {
    console.log('No items found');
  }
}

run();

import fetch from 'node-fetch';
import fs from 'fs';

const OLD_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwlsqwtVAm4DEU5ugDgleVKxOs2_HECqiOnbLTiLR74Pd25QzNITPjCaHr-llSrG-1Z/exec';
const OLD_SPREADSHEET_ID = '1qHteZrNUa3ln2lix3p1Bufsh1o6WN98Ogoy9acuTlBg';
const ACCESS_TOKEN = 'bible2026secret';
const EDITOR_ID = '109430604282542310163';
const url = `${OLD_WEBAPP_URL}?type=today&token=${ACCESS_TOKEN}&spreadsheetId=${OLD_SPREADSHEET_ID}&editorId=${EDITOR_ID}&callback=cb`;

fetch(url).then(res => res.text()).then(text => {
  fs.writeFileSync('old_response.json', text.replace(/^cb\(/, '').replace(/\);?$/, ''));
  console.log("Saved to old_response.json");
}).catch(console.error);

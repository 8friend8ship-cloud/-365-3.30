import fetch from 'node-fetch';

const OLD_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwlsqwtVAm4DEU5ugDgleVKxOs2_HECqiOnbLTiLR74Pd25QzNITPjCaHr-llSrG-1Z/exec';
const OLD_SPREADSHEET_ID = '1qHteZrNUa3ln2lix3p1Bufsh1o6WN98Ogoy9acuTlBg';
const ACCESS_TOKEN = 'bible2026secret';
const EDITOR_ID = '109430604282542310163';
const url = `${OLD_WEBAPP_URL}?type=today&token=${ACCESS_TOKEN}&spreadsheetId=${OLD_SPREADSHEET_ID}&editorId=${EDITOR_ID}&callback=cb`;

fetch(url).then(res => res.text()).then(text => {
  const jsonStr = text.replace(/^cb\(/, '').replace(/\);?$/, '');
  const data = JSON.parse(jsonStr);
  const item = data.payload.items[0];
  console.log("Keys in old item:", Object.keys(item));
  if (item.JP) console.log("JP in old item:", Object.keys(item.JP));
  if (item.translations) console.log("translations in old item:", Object.keys(item.translations));
  if (item.langs) console.log("langs in old item:", Object.keys(item.langs));
}).catch(console.error);

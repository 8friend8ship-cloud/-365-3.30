import fetch from 'node-fetch';

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwHt92CCmk_9Gu6kPYLwrAith_3SrYUnJE7A8_47RoJxUQlbwGgY-Me2E8rCBdY7WBeNQ/exec';
const SPREADSHEET_ID = '1HK4ATRZ-lSZ4fyuZi4ypHodgGZK1kBMsEFkAxOm9904';
const ACCESS_TOKEN = 'bible2026secret';
const EDITOR_ID = '109430604282542310163';
const url = `${WEBAPP_URL}?type=today&token=${ACCESS_TOKEN}&spreadsheetId=${SPREADSHEET_ID}&editorId=${EDITOR_ID}&callback=cb`;

fetch(url).then(res => res.text()).then(text => {
  const jsonStr = text.replace(/^cb\(/, '').replace(/\);?$/, '');
  const data = JSON.parse(jsonStr);
  const item = data.items[0];
  
  // Let's search for "JP" in the item keys
  console.log("Keys containing JP:", Object.keys(item).filter(k => k.includes('JP')));
  
  // Let's search for "JP" in the item values
  console.log("Values containing JP:", Object.values(item).filter(v => typeof v === 'string' && v.includes('JP')));
  
  // Let's search for "JP" in the nested objects
  console.log("Nested keys containing JP:");
  Object.keys(item).forEach(k => {
    if (typeof item[k] === 'object' && item[k] !== null) {
      console.log(`  In ${k}:`, Object.keys(item[k]).filter(nk => nk.includes('JP')));
    }
  });
}).catch(console.error);

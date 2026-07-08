import fetch from 'node-fetch';

const WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwHt92CCmk_9Gu6kPYLwrAith_3SrYUnJE7A8_47RoJxUQlbwGgY-Me2E8rCBdY7WBeNQ/exec';
const SPREADSHEET_ID = '1HK4ATRZ-lSZ4fyuZi4ypHodgGZK1kBMsEFkAxOm9904';
const ACCESS_TOKEN = 'bible2026secret';
const EDITOR_ID = '109430604282542310163';
const url = `${WEBAPP_URL}?type=all&token=${ACCESS_TOKEN}&spreadsheetId=${SPREADSHEET_ID}&editorId=${EDITOR_ID}&callback=cb`;

fetch(url).then(res => res.text()).then(text => {
  const jsonStr = text.replace(/^cb\(/, '').replace(/\);?$/, '');
  const data = JSON.parse(jsonStr);
  console.log(Object.keys(data.items[0]));
}).catch(console.error);

import fetch from 'node-fetch';

const OLD_PRIMARY_URL = 'https://script.google.com/macros/s/AKfycbwx7sU5mEpCcEbGqx6122eclRauaOwZS28ig5LyjUcEZnfjD-I/exec';
const SPREADSHEET_ID = '1qHteZrNUa3ln2lix3p1Bufsh1o6WN98Ogoy9acuTlBg';
const ACCESS_TOKEN = 'bible2026secret';
const EDITOR_ID = '109430604282542310163';
const url = `${OLD_PRIMARY_URL}?type=today&token=${ACCESS_TOKEN}&spreadsheetId=${SPREADSHEET_ID}&editorId=${EDITOR_ID}&callback=cb`;

fetch(url).then(res => res.text()).then(text => {
  console.log(text.substring(0, 500));
}).catch(console.error);

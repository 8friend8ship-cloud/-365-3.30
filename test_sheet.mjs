import fetch from 'node-fetch';

const SPREADSHEET_ID = '1HK4ATRZ-lSZ4fyuZi4ypHodgGZK1kBMsEFkAxOm9904';
const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv`;

fetch(url)
  .then(res => res.text())
  .then(text => {
    const lines = text.split('\n');
    console.log("Headers:", lines[0]);
  })
  .catch(console.error);

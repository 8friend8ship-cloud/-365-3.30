import fetch from 'node-fetch';

const OLD_PRIMARY_URL = 'https://script.google.com/macros/s/AKfycbwx7sU5mEpCcEbGqx6122eclRauaOwZS28ig5LyjUcEZnfjD-I/exec';
const SPREADSHEET_ID = '1HK4ATRZ-lSZ4fyuZi4ypHodgGZK1kBMsEFkAxOm9904'; // or maybe the old one? Let's try without it first
const ACCESS_TOKEN = 'bible2026secret';
const url = `${OLD_PRIMARY_URL}?type=today&token=${ACCESS_TOKEN}&callback=cb`;

fetch(url).then(res => res.text()).then(text => {
  const jsonStr = text.replace(/^cb\(/, '').replace(/\);?$/, '');
  const data = JSON.parse(jsonStr);
  console.log(JSON.stringify(data.items[0], null, 2));
}).catch(console.error);

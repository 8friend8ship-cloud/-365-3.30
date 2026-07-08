async function check() {
  const res = await fetch("https://docs.google.com/spreadsheets/d/1HK4ATRZ-lSZ4fyuZi4ypHodgGZK1kBMsEFkAxOm9904/export?format=csv");
  console.log(res.status);
  const text = await res.text();
  console.log(text.substring(0, 500));
}
check();

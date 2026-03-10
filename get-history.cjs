const { execSync } = require('child_process');
try {
  const output = execSync('git log -p -5 src/App.tsx').toString();
  console.log(output);
} catch (e) {
  console.error(e.message);
}

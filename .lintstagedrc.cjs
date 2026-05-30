module.exports = {
  "*.{ts,tsx,js,jsx}": ["eslint --fix"],
  "*.{ts,tsx}": [() => "npx tsc --noEmit"],
};

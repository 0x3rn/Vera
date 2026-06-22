const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

content = content.replace(/\bshadow-[a-z]+-\d+\/\d+\b/g, '');
content = content.replace(/\bhover:shadow-\S+\b/g, '');
content = content.replace(/\bshadow-(md|lg|xl|2xl)\b/g, '');
content = content.replace(/\bshadow-\[[^\]]+\]\b/g, '');
content = content.replace(/\bshadow-black\/\d+\b/g, '');

fs.writeFileSync('src/app/page.tsx', content);
console.log('Glow effects removed.');

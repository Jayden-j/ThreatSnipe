const fs = require('fs');
const content = fs.readFileSync('src/app/(app)/assets/[id]/page.tsx', 'utf8');
const lines = content.split('\n');

// Check line 1553 (index 1552) - the closing brace
console.log('Line 1554 (the closing brace at line 1554):');
const line1554 = lines[1553];
console.log(line1554);
for (let i = 0; i < line1554.length; i++) {
  const code = line1554.charCodeAt(i);
  console.log(`  pos ${i}: char '${line1554[i]}' (U+${code.toString(16).padStart(4, '0')})`);
}

// Count braces in the whole file
let openBraces = 0;
let closeBraces = 0;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') openBraces++;
  if (content[i] === '}') closeBraces++;
}
console.log(`\nTotal '{': ${openBraces}`);
console.log(`Total '}': ${closeBraces}`);
console.log(`Difference: ${openBraces - closeBraces}`);

// Check around line 1477 where the IIFE starts
console.log('\nLine 1478 (IIFE start):');
console.log(lines[1477]);

// Check for any non-ASCII or special characters
for (let i = 0; i < lines.length; i++) {
  for (let j = 0; j < lines[i].length; j++) {
    const code = lines[i].charCodeAt(j);
    // Check for curly quotes or other problematic unicode
    if (code === 0x201C || code === 0x201D || code === 0x2018 || code === 0x2019) {
      console.log(`Line ${i + 1}, pos ${j}: suspicious char '${lines[i][j]}' (U+${code.toString(16).padStart(4, '0')})`);
    }
  }
}
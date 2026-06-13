const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'SuperAdminCenter.tsx');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
const segment = lines.slice(3699, 4050).join('\n');

// A very simplified tag and curly tracker
let openDivs = 0;
let openCurlys = 0;

segment.split('\n').forEach((line, idx) => {
  const lineNum = idx + 3700;
  
  // Count div opens/closes
  const divOpens = (line.match(/<div(\s|>)/gi) || []).length;
  const divCloses = (line.match(/<\/div>/gi) || []).length;
  
  const curlyOpens = (line.match(/\{/g) || []).length;
  const curlyCloses = (line.match(/\}/g) || []).length;
  
  openDivs += divOpens - divCloses;
  openCurlys += curlyOpens - curlyCloses;
  
  if (divOpens > 0 || divCloses > 0 || curlyOpens > 0 || curlyCloses > 0) {
    console.log(`Line ${lineNum}: divBalance=${openDivs} curlyBalance=${openCurlys} | ${line.trim().slice(0, 50)}`);
  }
});

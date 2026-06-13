const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, 'src', 'components', 'SuperAdminCenter.tsx');
const replacementFilePath = path.join(__dirname, 'replacement.txt');

let content = fs.readFileSync(targetFilePath, 'utf8');
const replacement = fs.readFileSync(replacementFilePath, 'utf8');

// Identify exact markers
const startMarker = "{aiOpsSubTab === 'workflows' && (\n            <div className=\"space-y-6 animate-fadeIn\">";
const endMarker = "          {/* PART 4: 📚 知识库管理";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  console.log(`Found start block at ${startIndex} and end block at ${endIndex}! Applying workflows subtab patch...`);
  
  content = content.slice(0, startIndex) + replacement.trim() + "\n\n          " + content.slice(endIndex);
  fs.writeFileSync(targetFilePath, content, 'utf8');
  console.log("Successfully patched SuperAdminCenter.tsx!");
} else {
  console.log(`Error: Could not locate block markers. startIndex=${startIndex}, endIndex=${endIndex}`);
}

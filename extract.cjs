const fs = require('fs');
const lines = fs.readFileSync('C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\0655e60b-5e67-4098-9b29-bb807b729ec9\\.system_generated\\logs\\transcript.jsonl', 'utf8').split('\n');
for (let line of lines) {
  if (line.includes('ActivitiesManagement.jsx') && line.includes('Showing lines 1 to')) {
    const obj = JSON.parse(line);
    const content = obj.content;
    if (content.includes('Total Lines:') && parseInt(content.match(/Total Lines: (\d+)/)[1]) > 500) {
        const match = content.match(/1: .*/s);
        if (match) {
            let text = match[0];
            text = text.replace(/The above content.*$/s, '');
            text = text.replace(/^\d+:\s/gm, '');
            fs.writeFileSync('d:\\SadhnaGPT\\sadhanagptreactweb\\src\\pages\\counsellor\\ActivitiesManagement.jsx', text);
            console.log('Restored correctly from logs. Length: ' + text.length);
            process.exit(0);
        }
    }
  }
}
console.log('Could not find large file chunk.');

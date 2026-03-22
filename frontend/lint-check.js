const { execSync } = require('child_process');
const fs = require('fs');

try {
    const output = execSync('npx eslint src --format json', { encoding: 'utf-8' });
    processOutput(output);
} catch (e) {
    if (e.stdout) processOutput(e.stdout);
    else console.log(e.message);
}

function processOutput(jsonStr) {
    try {
        const data = JSON.parse(jsonStr);
        const out = data.filter(d => d.errorCount > 0 || d.warningCount > 0).flatMap(d => d.messages.map(m => d.filePath + ':' + m.line + ' ' + m.message)).join('\n');
        fs.writeFileSync('eslint-output.txt', out);
        console.log("Wrote to eslint-output.txt");
    } catch (err) {
        console.log("Parse error:", err.message);
    }
}

import fs from 'fs';

let code = fs.readFileSync('src/App.jsx', 'utf8');

// Replace standard literal starting with slash: fetch('/
code = code.replace(/fetch\('(\/[^']+)'/g, 'fetch(\`${API_URL}$1\`');
code = code.replace(/fetch\("(\/[^"]+)"/g, 'fetch(\`${API_URL}$1\`');
// Replace backtick started with slash: fetch(`/
code = code.replace(/fetch\(`(\/[^`]+)`/g, 'fetch(\`${API_URL}$1\`');

// I also see fetch('http://localhost:5000/api...') or http://127.0.0.1:5000/api in some places potentially
code = code.replace(/fetch\(['"`]http:\/\/(?:localhost|127\.0\.0\.1):5000\/api\/([^'"`]+)['"`]/g, 'fetch(\`${API_URL}/$1\`');

fs.writeFileSync('src/App.jsx', code);
console.log('Done replacement');

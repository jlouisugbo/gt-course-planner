const fs = require('fs');

// Read and inspect your JSON file
const inputData = JSON.parse(fs.readFileSync('./data/202508-readable.json', 'utf8'));

console.log('Type of data:', typeof inputData);
console.log('Is array:', Array.isArray(inputData));
console.log('Keys if object:', Object.keys(inputData));
console.log('First few items:', JSON.stringify(inputData, null, 2).slice(0, 500));
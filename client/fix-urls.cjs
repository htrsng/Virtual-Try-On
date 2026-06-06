const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('d:/Virtual Try-On/client/src');
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content.replace(/http:\/\/localhost:3000\/api/g, '/api');
    if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        changedFiles++;
        console.log('Updated', file);
    }
});

console.log(`Replaced hardcoded API URL in ${changedFiles} files.`);

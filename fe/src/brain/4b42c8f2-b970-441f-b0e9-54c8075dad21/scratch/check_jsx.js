const fs = require('fs');
const content = fs.readFileSync('d:\\test-laravel\\fe\\src\\pages\\Customer\\Checkout.jsx', 'utf8');

const openDiv = (content.match(/<div/g) || []).length;
const closeDiv = (content.match(/<\/div>/g) || []).length;
const openSection = (content.match(/<section/g) || []).length;
const closeSection = (content.match(/<\/section>/g) || []).length;
const openForm = (content.match(/<form/g) || []).length;
const closeForm = (content.match(/<\/form>/g) || []).length;

console.log(`Divs: ${openDiv} / ${closeDiv}`);
console.log(`Sections: ${openSection} / ${closeSection}`);
console.log(`Forms: ${openForm} / ${closeForm}`);

// Tìm đoạn code nghi vấn
const lines = content.split('\n');
lines.forEach((line, index) => {
    if (line.includes('lg:col-span-7') || line.includes('lg:col-span-5')) {
        console.log(`Line ${index + 1}: ${line.trim()}`);
    }
});

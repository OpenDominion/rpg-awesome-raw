#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ICOMOON_OUT = '/app/output-mount/icomoon';
const DIST = '/app/dist-mount';

const styleCSS = fs.readFileSync(path.join(ICOMOON_OUT, 'style.css'), 'utf8');

// Extract entries like:
// .ra-abacus:before {
//   content: "\e900";
// }
const icons = [];
const iconRegex = /\.(ra-[\w-]+):before \{\n  content: "([^"]+)";\n\}/g;
let match;
while ((match = iconRegex.exec(styleCSS)) !== null) {
  icons.push({ cls: match[1], code: match[2] });
}

if (icons.length === 0) {
  console.error('No icons found in style.css — check the regex against the actual output format.');
  process.exit(1);
}

// _variables.scss
const variablesBody = icons.map(i => `$${i.cls}: '${i.code}';`).join('\n');

// _icons.scss
const iconsBody = icons
  .map(i => `.${i.cls} {\n  &:before {\n    content: $${i.cls}; \n  }\n}`)
  .join('\n\n');

fs.mkdirSync(path.join(DIST, 'scss'), { recursive: true });
fs.writeFileSync(path.join(DIST, 'scss', '_variables.scss'), variablesBody + '\n');
fs.writeFileSync(path.join(DIST, 'scss', '_icons.scss'), `@use 'variables' as *;\n\n` + iconsBody + '\n');

const srcFonts = path.join(ICOMOON_OUT, 'fonts');
const dstFonts = path.join(DIST, 'fonts');
fs.mkdirSync(dstFonts, { recursive: true });
const fontFiles = fs.readdirSync(srcFonts);
fontFiles.forEach(f => fs.copyFileSync(path.join(srcFonts, f), path.join(dstFonts, f)));

console.log(`[transform] ${icons.length} icons → dist/scss/_variables.scss, dist/scss/_icons.scss`);
console.log(`[transform] fonts copied: ${fontFiles.join(', ')}`);

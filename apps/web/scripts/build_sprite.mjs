#!/usr/bin/env node
// Builds static/icons/sprite.svg from individual SVG icon files.
// Uses <symbol> elements so icons can be referenced via:
//   <svg><use href="static/icons/sprite.svg#icon-name"/></svg>

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = resolve(__dirname, '../static/icons');

// Icons currently referenced in index.html, in order.
const ICONS = [
    'pen-pencil',
    'pen-tool-pen',
    'dropper-tools-and-utensils',
    'pen-tool-2',
    'magnet-magnet',
    'paint-bucket-2',
    'selection-rectangle',
    'stamp',
    'scraper',
    'eraser-1',
    'delete',
    'undo-arrows',
    'redo-arrows',
];

function extractViewBox(svgText) {
    const m = svgText.match(/viewBox=["']([\d\s.]+)["' ]/);
    return m ? m[1].trim() : '0 0 100 100';
}

function extractInnerContent(svgText) {
    // Remove XML declaration and DOCTYPE
    let s = svgText.replace(/<\?xml[^?]*\?>/g, '');
    s = s.replace(/<!DOCTYPE[^[>]*(\[[^\]]*\])?\s*>/g, '');
    s = s.replace(/<!--.*?-->/gs, '');
    s = s.trim();
    // Find the outer <svg> open tag end
    const svgOpen = s.indexOf('<svg');
    if (svgOpen === -1) return s;
    const tagEnd = s.indexOf('>', svgOpen);
    if (tagEnd === -1) return s;
    const close = s.lastIndexOf('</svg>');
    if (close === -1) return s;
    return s.slice(tagEnd + 1, close).trim();
}

const symbols = ICONS.map((name) => {
    const raw = readFileSync(resolve(ICONS_DIR, `${name}.svg`), 'utf8');
    const viewBox = extractViewBox(raw);
    const inner = extractInnerContent(raw);
    return `  <symbol id="${name}" viewBox="${viewBox}">\n    ${inner}\n  </symbol>`;
});

const sprite = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="display:none">
${symbols.join('\n')}
</svg>
`;

const outPath = resolve(ICONS_DIR, 'sprite.svg');
writeFileSync(outPath, sprite, 'utf8');
console.log(`Wrote ${outPath} (${ICONS.length} symbols)`);

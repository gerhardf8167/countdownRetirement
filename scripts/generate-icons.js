import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const label = Buffer.from(type);
  const length = Buffer.alloc(4);
  const check = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  check.writeUInt32BE(crc32(Buffer.concat([label, data])));
  return Buffer.concat([length, label, data, check]);
}

for (const size of [192, 512]) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      const offset = row * (size * 3 + 1) + 1 + column * 3;
      raw.set([23, 63, 54], offset);
    }
  }
  function rectangle(left, top, width, height) {
    for (let row = Math.round(top * size); row < Math.round((top + height) * size); row += 1) {
      for (let column = Math.round(left * size); column < Math.round((left + width) * size); column += 1) {
        raw.fill(255, row * (size * 3 + 1) + 1 + column * 3, row * (size * 3 + 1) + 4 + column * 3);
      }
    }
  }
  rectangle(.23, .25, .54, .025);
  rectangle(.23, .75, .54, .025);
  rectangle(.23, .25, .025, .525);
  rectangle(.745, .25, .025, .525);
  rectangle(.23, .38, .54, .025);
  rectangle(.35, .20, .025, .1);
  rectangle(.625, .20, .025, .1);
  rectangle(.33, .46, .15, .025);
  rectangle(.33, .56, .15, .025);
  rectangle(.33, .66, .15, .025);
  rectangle(.455, .46, .025, .225);
  rectangle(.595, .46, .03, .225);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2;
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
  writeFileSync(new URL(`../icons/icon-${size}.png`, import.meta.url), png);
  if (size === 512) writeFileSync(new URL('../icons/icon-maskable.png', import.meta.url), png);
}
console.log('PNG icons generated (192, 512, maskable).');
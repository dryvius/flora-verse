import { createHash } from 'node:crypto'
import { createWriteStream, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const SIZE = 81
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT_DIR = join(ROOT, 'src', 'static', 'tabbar')

function crc32(buffer) {
  let crc = 0xffffffff
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i]
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1)
      crc = (crc >>> 1) ^ (0xedb88320 & mask)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type)
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crcInput = Buffer.concat([typeBuffer, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(crcInput), 0)
  return Buffer.concat([length, crcInput, crc])
}

function createPng(r, g, b) {
  const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE)
  for (let y = 0; y < SIZE; y += 1) {
    const rowStart = y * (SIZE * 4 + 1)
    raw[rowStart] = 0
    for (let x = 0; x < SIZE; x += 1) {
      const center = (SIZE - 1) / 2
      const dx = x - center
      const dy = y - center
      const inside = dx * dx + dy * dy <= 26 * 26
      const offset = rowStart + 1 + x * 4
      if (inside) {
        raw[offset] = r
        raw[offset + 1] = g
        raw[offset + 2] = b
        raw[offset + 3] = 255
      } else {
        raw[offset] = 0
        raw[offset + 1] = 0
        raw[offset + 2] = 0
        raw[offset + 3] = 0
      }
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(SIZE, 0)
  ihdr.writeUInt32BE(SIZE, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const idat = deflateSync(raw, { level: 9 })
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ])
}

function writePng(name, r, g, b) {
  const filePath = join(OUTPUT_DIR, name)
  const stream = createWriteStream(filePath)
  stream.write(createPng(r, g, b))
  stream.end()
  return createHash('md5').update(name).digest('hex').slice(0, 8)
}

mkdirSync(OUTPUT_DIR, { recursive: true })
writePng('home.png', 125, 149, 136)
writePng('home-active.png', 232, 197, 106)
writePng('capture.png', 125, 149, 136)
writePng('capture-active.png', 232, 197, 106)
writePng('collection.png', 125, 149, 136)
writePng('collection-active.png', 232, 197, 106)
writePng('me.png', 125, 149, 136)
writePng('me-active.png', 232, 197, 106)
writePng('rank.png', 125, 149, 136)
writePng('rank-active.png', 232, 197, 106)

console.log(`tabbar icons generated at ${OUTPUT_DIR}`)

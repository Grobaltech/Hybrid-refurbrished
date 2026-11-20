import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#111827"/><path d="M118 92h276v76H202v88h166v72H202v92h-84z" fill="#fff"/><path d="M286 168h108v76H286zM286 328h108v92H286z" fill="#6366f1"/><path d="M118 256h84v72h-84z" fill="#6366f1"/></svg>`)
await mkdir('resources', { recursive: true })
await sharp(svg).resize(1024, 1024).png().toFile('resources/icon.png')
await sharp({ create: { width: 2732, height: 2732, channels: 4, background: '#111827' } }).png().toFile('resources/splash.png')
console.log('Generated Android launcher and splash source images.')

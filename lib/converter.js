import { promises as fs } from 'fs'
import { join, dirname } from 'path'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
  const tmpDir = join(__dirname, '../tmp')
  await fs.mkdir(tmpDir, { recursive: true })

  const id = randomUUID()
  const inputPath = join(tmpDir, `${id}.${ext}`)
  const outputPath = join(tmpDir, `${id}.${ext2}`)

  await fs.writeFile(inputPath, buffer)

  return new Promise((resolve, reject) => {
    const ff = spawn('ffmpeg', [
      '-y',
      '-i', inputPath,
      ...args,
      outputPath
    ])

    let stderr = ''
    ff.stderr.on('data', chunk => stderr += chunk.toString())
    ff.on('error', reject)

    ff.on('close', async (code) => {
      await fs.unlink(inputPath).catch(() => {}) // ignora si falla

      if (code !== 0) {
        return reject(new Error(`ffmpeg exited with code ${code}:\n${stderr}`))
      }

      try {
        const data = await fs.readFile(outputPath)
        resolve({
          data,
          filename: outputPath,
          delete() {
            return fs.unlink(outputPath)
          }
        })
      } catch (e) {
        reject(e)
      }
    })
  })
}

function toPTT(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on'
  ], ext, 'ogg')
}

function toAudio(buffer, ext) {
  return ffmpeg(buffer, [
    '-vn',
    '-c:a', 'libopus',
    '-b:a', '128k',
    '-vbr', 'on',
    '-compression_level', '10'
  ], ext, 'opus')
}

function toVideo(buffer, ext) {
  return ffmpeg(buffer, [
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-crf', '32',
    '-preset', 'slow'
  ], ext, 'mp4')
}

export { toAudio, toPTT, toVideo, ffmpeg }

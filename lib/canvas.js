import { spawn } from 'child_process'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Genera una imagen de "Level Up"
 * @param {String} teks - Texto del nombre o mensaje
 * @param {Number} level - Nivel actual
 * @returns {Promise<Buffer>}
 */
export function levelup(teks, level) {
    return new Promise((resolve, reject) => {
        // Verifica compatibilidad
        if (!(global.support?.convert || global.support?.magick || global.support?.gm)) {
            return reject('¡No hay soporte para ImageMagick o GraphicsMagick!')
        }

        const fontDir = join(__dirname, '../src/font')
        const fontLevel = join(fontDir, 'level_c.otf')
        const fontTexts = join(fontDir, 'texts.otf')
        const templatePath = join(__dirname, '../src/lvlup_template.jpg')

        // Ajuste de posición según nivel
        let anotations = '+1385+260'
        if (level > 2) anotations = '+1370+260'
        if (level > 10) anotations = '+1330+260'
        if (level > 50) anotations = '+1310+260'
        if (level > 100) anotations = '+1260+260'

        const [_spawnprocess, ..._spawnargs] = [
            ...(global.support.gm ? ['gm'] : global.support.magick ? ['magick'] : []),
            'convert',
            templatePath,
            '-font', fontTexts,
            '-fill', '#0F3E6A',
            '-size', '1024x784',
            '-pointsize', '68',
            '-interline-spacing', '-7.5',
            '-annotate', '+153+200', teks,
            '-font', fontLevel,
            '-fill', '#0A2A48',
            '-size', '1024x784',
            '-pointsize', '140',
            '-interline-spacing', '-1.2',
            '-annotate', anotations, String(level),
            'jpg:-'
        ]

        const bufs = []
        const child = spawn(_spawnprocess, _spawnargs)

        child.stdout.on('data', chunk => bufs.push(chunk))
        child.stderr.on('data', err => console.error('ImageMagick error:', err.toString()))
        child.on('error', reject)
        child.on('close', code => {
            if (code !== 0) return reject(new Error(`Proceso cerrado con código ${code}`))
            resolve(Buffer.concat(bufs))
        })
    })
}

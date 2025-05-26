import { resolve, dirname as _dirname } from 'path'
import _fs, { existsSync, readFileSync } from 'fs'
const { promises: fs } = _fs

class Database {
  constructor(filepath, ...args) {
    this.file = resolve(filepath)
    this.logger = console
    this._jsonargs = args
    this._data = {}
    this._state = false
    this._queue = []

    // auto procesamiento en segundo plano
    this._interval = setInterval(async () => {
      if (!this._state && this._queue.length > 0) {
        this._state = true
        const task = this._queue.shift()
        if (typeof this[task] === 'function') {
          try {
            await this[task]()
          } catch (e) {
            this.logger.error(`Error in ${task}:`, e)
          }
        }
        this._state = false
      }
    }, 1000)

    // Carga inicial síncrona
    this._load()
  }

  get data() {
    return this._data
  }

  set data(value) {
    this._data = value
    this.save()
  }

  load() {
    if (!this._queue.includes('_load')) this._queue.push('_load')
  }

  save() {
    if (!this._queue.includes('_save')) this._queue.push('_save')
  }

  _load() {
    try {
      this._data = existsSync(this.file)
        ? JSON.parse(readFileSync(this.file))
        : {}
    } catch (e) {
      this.logger.error('Failed to load DB:', e)
      this._data = {}
    }
  }

  async _save() {
    try {
      const dirname = _dirname(this.file)
      if (!existsSync(dirname)) await fs.mkdir(dirname, { recursive: true })
      await fs.writeFile(this.file, JSON.stringify(this._data, ...this._jsonargs))
      return this.file
    } catch (e) {
      this.logger.error('Failed to save DB:', e)
    }
  }

  close() {
    clearInterval(this._interval)
  }
}

export default Database

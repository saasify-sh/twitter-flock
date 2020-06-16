const fs = require('fs')

class FlatFilePersistence {
  constructor(fileName) {
    this.fileName = fileName
  }

  load() {
    const label = `Loading data from ${this.fileName}`
    console.time(label)
    try {
      let ret = fs.readFileSync(this.fileName, 'utf8')
      ret = JSON.parse(ret)
      console.timeEnd(label)
      return ret
    } catch (err) {
      console.timeEnd(label)
      throw new Error(`Unable to load persistence from file "${this.fileName}"`)
    }
  }

  save(data) {
    const label = `Saving data to ${this.fileName}`
    console.time(label)
    try {
      fs.writeFileSync(this.fileName, JSON.stringify(data), 'utf8')
      console.timeEnd(label)
    } catch (err) {
      throw new Error(`Unable to save persistence to file "${this.fileName}"`)
    }
  }
}

module.exports = FlatFilePersistence

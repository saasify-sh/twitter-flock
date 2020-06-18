'use strict'

const fs = require('fs-extra')
const xlsx = require('xlsx')

const getFileExtension = require('./get-file-extension')

/**
 * Formats the given JSON object, optionally writing the output to a `file`.
 *
 * If no options or filename is passed, the input will be returned untransformed.
 *
 * @param {object} object - JSON to format.
 * @param {object|string} [opts] - Filename to write or config options.
 * @param {string} [opts.file] - Optional filename to write.
 * @param {string} [opts.format] - Optional fFile format to use (by default this is inferred from the filename).
 * @param {string} [opts.encoding] - Optional file encoding to use (by default this is inferred from the file format).
 * @param {string} [opts.label] - Optional sheet name.
 *
 * @return {Promise}
 */
module.exports = async (object, opts = {}) => {
  if (typeof opts === 'string') {
    opts = { file: opts }
  }

  const { format, file, pretty = true, label = 'Results' } = opts

  if (!format && !file) {
    if (pretty) {
      console.log(JSON.stringify(object, null, 2))
    } else {
      console.log(JSON.stringify(object))
    }

    return object
  }

  if (file && getFileExtension(file) === 'json') {
    await fs.writeJson(file, object, pretty ? { spaces: 2 } : undefined)
    return object
  }

  const ws = xlsx.utils.json_to_sheet(object)
  const wb = xlsx.utils.book_new()
  xlsx.utils.book_append_sheet(wb, ws, label)

  if (file) {
    return xlsx.writeFile(wb, file)
  }

  const encoding = opts.encoding
    ? opts.encoding.toLowerCase()
    : {
        htm: 'string',
        html: 'string',
        txt: 'string',
        csv: 'string',
        tsv: 'string',
        xml: 'string',
        lxml: 'string'
      }[format] || 'binary'

  return xlsx.write(wb, {
    bookType: format,
    type: encoding
  })
}

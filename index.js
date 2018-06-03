const fs = require('fs')
const process = require('process')
const ByteBuffer = require('bytebuffer')

let options = {
    dumpDecrypted: false
}

let filePath = process.argv[2]

for (const arg of process.argv) {
    if (arg.includes('-d')) {
        options.dumpDecrypted = true
    }
}

if (!filePath) {
    console.log(`Please specify a filename as the first argument.`)
    console.log(`Additional options:\n -d      Dump decrypted file.`)
    console.log(`Example:\n node index.js 'log_current.sce' [-d]`)
    process.exit(0)
}

if (!fs.readFileSync(filePath)) {
    throw new Error("The file could not be found!")
}
try {
    let fileContent = fs.readFileSync(filePath)
    let decrypted = ByteBuffer.fromUTF8(magic(fileContent.toString('utf8')))
    if (options.dumpDecrypted) {
        fs.writeFileSync(`${filePath.split('.')[0]}_decrypted.sce`, decrypted.toString('utf8'))
    }
    let items = []
    while (decrypted.buffer.length > decrypted.offset) {
        items.push(parse(decrypted))
    }
    let output = JSON.stringify(items, '', 4)
    fs.writeFileSync(`${filePath.split('.')[0]}_parsed.json`, output.toString('utf8'))
}
catch {

}

/**
 * Parses and saves the decrypted sce file
 * @param {ByteBuffer} sceContent The decrypted sce file
 */
function parse(sceContent) {
    let length = sceContent.readByte()
    let items = [{ key: '', value: '' }]
    items = items.slice(0, 0)
    for (let i = 0; i < length / 2; i++) {
        let item = {}
        item.key = readString(sceContent)
        item.value = readString(sceContent)
        items.push(item)
    }
    return items
}

/**
 * Reads a string which is prefixed with a uint length from the ByteBuffer object
 * @param {ByteBuffer} buffer The buffer to read string from
 */
function readString(buffer) {
    let strLen = buffer.readUint16()
    return buffer.readString(strLen)
}

/**
 * 
 * @param {string} input The input to apply magic on :)
 */
// * @param {string} key The key to use for the magic
function magic(input) {
    let key = 'secrets.'
    let result = []
    for (let c = 0; c < input.length; c++) {
        let charCode = input.charCodeAt(c) ^ key[c % key.length].charCodeAt(0)
        result.push(String.fromCharCode(charCode))
    }
    return result.join('')
}

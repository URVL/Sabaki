const nativeRequire = eval('require')

const {remote} = require('electron')
const isRenderer = remote != null
const fs = require('fs')
const dolm = require('dolm').load({})

const setting = isRenderer ? remote.require('./setting') : nativeRequire('./setting')

exports.t = dolm.t
exports.context = dolm.context

exports.loadStrings = function(strings) {
    dolm.load(strings)

    exports.strings = strings
    exports.usedStrings = dolm.usedStrings
}

exports.load = function(filename) {
    exports.loadStrings(nativeRequire(filename))
}

exports.serialize = function(filename) {
    if (isRenderer) {
        // Merge with dolm serialization result in main process

        let mainI18n = remote.require('./i18n')
        let mainStrings = mainI18n.strings
        let mainUsedStrings = mainI18n.usedStrings

        for (context in mainStrings) {
            exports.strings[context] = mainStrings[context]
        }

        for (context in mainUsedStrings) {
            exports.usedStrings[context] = mainUsedStrings[context]
        }
    }

    let result = dolm.serialize()
    let js = `module.exports = ${result.js}`

    fs.writeFileSync(filename, js)

    return result
}

try {
    let lang = setting.get('app.lang')

    exports.load(`${isRenderer ? '.' : '..'}/lang/${lang}.js`)
} catch (err) {
    exports.loadStrings({})
}

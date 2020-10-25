const find = require('b-tree/find')

module.exports = function (comparator, array, set, {
    nullify = key => { return { key, parts: null } }, extractor = $ => $, slice = 32
} = {}) {
    const keys = set[Symbol.iterator]()
    let index = 0
    let next = keys.next()
    const iterator = {
        done: false,
        next (trampoline, consume, terminator = iterator) {
            if (next.done) {
                terminator.done = true
                return
            }
            const got = []
            for (;;) {
                if (next.done || got.length == slice) {
                    break
                }
                const { value } = next
                const sought = extractor(value)
                const index = find(comparator, array, sought, 0)
                if (index < 0) {
                    got.push({ ...nullify(sought), value })
                } else {
                    const { key, parts } = array[index]
                    got.push({ key, parts, value })
                }
                next = keys.next()
            }
            trampoline.sync(() => consume(got))
        }
    }
    return iterator
}

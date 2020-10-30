const find = require('b-tree/find')

module.exports = function (comparator, array, set, {
    group = (sought, array, index, found) => found,
    nullify = (sought, value) => { return { key: null, parts: null } },
    extractor = $ => $,
    slice = 32
} = {}) {
    const keys = set[Symbol.iterator]()
    const I = array.length
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
                let found = index >= 0
                let i = found ? index : ~index, order = 1
                const entry = { key: sought, value, items: [] }
                got.push(entry)
                if (i < I && group(sought, array, i, found)) {
                    const { key, parts } = array[i++]
                    entry.items.push({ key, parts })
                    while (i < I && group(sought, array, i, false)) {
                        const { key, parts } = array[i++]
                        entry.items.push({ key, parts })
                    }
                }
                next = keys.next()
            }
            trampoline.sync(() => consume(got))
        }
    }
    return iterator
}

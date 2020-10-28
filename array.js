const find = require('b-tree/find')

module.exports = function (comparator, array, set, {
    group = (sought, array, index, found) => found,
    nullify = sought => { return { key: null, parts: null } },
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
                if (i < I && group(sought, array, i, found)) {
                    const { key, parts } = array[i++]
                    got.push({ key, parts, sought: { key: sought , value }, index: 0 })
                    while (i < I && group(sought, array, i, false)) {
                        const { key, parts } = array[i++]
                        got.push({ key, parts, sought: { key: sought, value }, index: order++ })
                    }
                } else {
                    got.push({ ...nullify(sought), sought: { key: sought, value }, index: -1 })
                }
                next = keys.next()
            }
            trampoline.sync(() => consume(got))
        }
    }
    return iterator
}

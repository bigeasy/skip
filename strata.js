const mvcc = require('mvcc')

// Of course to reverse, you would just pass in the set in reverse order.
module.exports = function (strata, set, {
    nullify = (sought, value) => { return { key: null, parts: null } },
    extractor = $ => $,
    group = (sought, key, found) => found,
    slice = 32
} = {}) {
    const keys = set[Symbol.iterator]()
    let index = 0, sought = null, continued = null, entry = null
    let next = keys.next()
    const iterator = {
        done: false,
        type: mvcc.MAP,
        next (trampoline, consume, terminator = iterator) {
            if (next.done) {
                terminator.done = true
                return
            }
            const { value } = next
            const key = continued != null
                      ? continued
                      : sought = extractor(value)
            strata.search(trampoline, key, cursor => {
                const got = [], { page: { id, items, right }, found, index } = cursor, I = items.length
                const reallyFound = continued == null && found
                if (continued == null) {
                    entry = { key: sought, value: value, items: [] }
                }
                continued = null
                if (index < I && group(sought, items[index].key, reallyFound)) {
                    const { key, parts } = items[index]
                    entry.items.push({ key, parts })
                    let i
                    for (
                        i = index + 1;
                        i < I && group(sought, items[i].key, false);
                        i++
                    ) {
                        const { key, parts } = items[i]
                        entry.items.push({ key, parts })
                    }
                    if (i == I && right != null && group(sought, right, false)) {
                        continued = right
                        consume(got)
                        return
                    }
                }
                got.push(entry)
                for (;;) {
                    if ((next = keys.next()).done || got.length >= slice) {
                        break
                    }
                    const { value } = next
                    sought = extractor(value)
                    const { found, index } = cursor.indexOf(sought)
                    if (index == null) {
                        break
                    }
                    entry = { key: sought, value: value, items: [] }
                    if (index < I && group(sought, items[index].key, found)) {
                        const { key, parts } = items[index]
                        entry.items.push({ key, parts })
                        let i
                        for (
                            i = index + 1;
                            i < I && group(sought, items[i].key, false);
                            i++
                        ) {
                            const { key, parts } = items[i]
                            entry.items.push({ key, parts })
                        }
                        if (i == I && right != null && group(sought, right, false)) {
                            continued = right
                            break
                        }
                    }
                    got.push(entry)
                }
                consume(got)
            })
        }
    }
    return iterator
}

// Of course to reverse, you would just pass in the set in reverse order.
module.exports = function (strata, set, {
    nullify = key => { return { key, parts: null } },
    extractor = $ => $,
    // TODO Occurs to me that filter is a misnomer since we are not rejecting
    // based on a key but finding bounaries. Maybe the function name should be
    // `bound` or better still `partition`, no `group`.
    filter = (sought, key, found) => found,
    slice = 32
} = {}) {
    const keys = set[Symbol.iterator]()
    let index = 0, sought = null, continued = null, offset = 0
    let next = keys.next()
    const iterator = {
        done: false,
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
                continued = null
                if (index < I && filter(sought, items[index].key, reallyFound)) {
                    const { key, parts } = items[index]
                    got.push({ key, parts, value, index: offset + 0 })
                    let i
                    for (
                        i = index + 1;
                        i < I && filter(sought, items[i].key, false);
                        i++
                    ) {
                        const { key, parts } = items[i]
                        got.push({ key, parts, value, index: offset + i - index })
                    }
                    if (i == I && right != null && filter(sought, right, false)) {
                        continued = right
                        offset = i - index
                        consume(got)
                        return
                    }
                } else {
                    got.push({ ...nullify(sought), value, index: -1 })
                }
                offset = 0
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
                    if (index < I && filter(sought, items[index].key, found)) {
                        const { key, parts } = items[index]
                        got.push({ key, parts, value, index: 0 })
                        let i
                        for (
                            i = index + 1;
                            i < I && filter(sought, items[i].key, false);
                            i++
                        ) {
                            const { key, parts } = items[i]
                            got.push({ key, parts, value, index: i - index })
                        }
                        if (i == I && right != null && filter(sought, right, false)) {
                            continued = right
                            offset = i - index
                            break
                        }
                    } else {
                        got.push({ ...nullify(sought), value, index: -1 })
                    }
                }
                consume(got)
            })
        }
    }
    return iterator
}

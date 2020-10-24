// Of course to reverse, you would just pass in the set in reverse order.
module.exports = function (strata, set, {
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
            let key, parts
            const { value } = next
            const sought = extractor(value)
            strata.search(trampoline, sought, cursor => {
                const got = [], { page, found, index } = cursor
                if (found) {
                    const { key, parts } = page.items[index]
                    got.push({ key, parts, value })
                } else {
                    got.push({ ...nullify(sought), value })
                }
                for (;;) {
                    if ((next = keys.next()).done || got.length >= slice) {
                        break
                    }
                    const { value } = next, sought = extractor(value)
                    const { found, index } = cursor.indexOf(sought)
                    if (index == null) {
                        break
                    }
                    if (found) {
                        const { key, parts } = page.items[index]
                        got.push({ key, parts, value })
                    } else {
                        got.push({ ...nullify(sought), value })
                    }
                }
                consume(got)
            })
        }
    }
    return iterator
}

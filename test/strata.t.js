require('proof')(6, async okay => {
    const skip = require('../strata')

    const path = require('path')

    const ascension = require('ascension')
    const Strata = require('b-tree')
    const Cache = require('b-tree/cache')
    const Trampoline = require('reciprocate')
    const Destructible = require('destructible')

    const utilities = require('b-tree/utilities')

    const directory = path.resolve(__dirname, './tmp/skip')

    const partial = ascension([ String ], object => object)

    await utilities.reset(directory)
    await utilities.serialize(directory, {
      '0.0': [ [ '0.1', null ], [ '1.1', [ 'c', 2 ] ], [ '1.3', [ 'e', 1 ] ], [ '1.5', [ 'm', 1 ] ] ],
      '0.1': [ [ 'right', [ 'c', 2 ] ], [ 'insert', 0, [ 'a', 0 ] ], [ 'insert', 1, [ 'a', 1 ] ],
        [ 'insert', 2, [ 'b', 0 ] ], [ 'insert', 3, [ 'c', 0 ] ], [ 'insert', 4, [ 'c', 1 ] ] ],
      '1.1': [ [ 'right', [ 'g', 0 ] ], [ 'insert', 0, [ 'c', 2 ] ], [ 'insert', 1, [ 'd', 0 ] ], [ 'insert', 2, [ 'e', 0 ] ] ],
      '1.3': [ [ 'right', [ 'm', 1 ] ] ,[ 'insert', 0, [ 'g', 0 ] ], [ 'insert', 1, [ 'h', 0 ] ], [ 'insert', 2, [ 'j', 0 ] ],
        [ 'insert', 3, [ 'm', 0 ] ], [ 'delete', 0 ] ],
      '1.5': [ [ 'insert', 0, [ 'm', 1 ] ], [ 'insert', 1, [ 'm', 2 ] ], [ 'insert', 2, [ 'm', 3 ] ], [ 'delete', 0 ] ]
    })

    const set = [ 'a', 'b', 'c', 'e', 'f', 'g', 'j' ].map(letter => [ letter, 0 ])
    const expected = set.map(letter => {
        return {
            key: /^f|g$/.test(letter[0]) ? null : letter,
            parts: /^f|g$/.test(letter[0]) ? null : [ letter ],
            sought: { key: letter, value: letter },
            index: /^f|g$/.test(letter[0]) ? -1 : 0
        }
    })

    {
        const destructible = new Destructible([ 'defaults' ])
        const strata = new Strata(destructible, {
            directory,
            cache: new Cache,
            compare: ascension([ String, Number ], object => object)

        })
        await strata.open()
        const gathered = [], trampoline = new Trampoline
        const iterator = skip(strata, set)
        iterator.next(trampoline, items => {
            okay(items.length, 3, 'default slice limit')
            for (const item of items) {
                gathered.push(item)
            }
        })
        while (trampoline.seek()) {
            await trampoline.shift()
        }
        while (!iterator.done) {
            iterator.next(trampoline, items => {
                for (const item of items) {
                    gathered.push(item)
                }
            })
            while (trampoline.seek()) {
                await trampoline.shift()
            }
        }
        okay(gathered, expected, 'defaults')
        strata.destructible.destroy().rejected
    }

    {
        const destructible = new Destructible([ 'specified' ])
        const strata = new Strata(destructible, { directory, cache: new Cache })
        await strata.open()
        const gathered = [], trampoline = new Trampoline
        const iterator = skip(strata, set, {
            nullify: key => { return { key: null, parts: null } }, extractor: $ => $, slice: 2
        })
        iterator.next(trampoline, items => {
            okay(items.length, 2, 'slice limited')
            for (const item of items) {
                gathered.push(item)
            }
        })
        while (trampoline.seek()) {
            await trampoline.shift()
        }
        while (!iterator.done) {
            iterator.next(trampoline, items => {
                for (const item of items) {
                    gathered.push(item)
                }
            })
            while (trampoline.seek()) {
                await trampoline.shift()
            }
        }
        okay(gathered, expected, 'specified')
        strata.destructible.destroy().rejected
    }

    {
        const destructible = new Destructible([ 'reversed' ])
        const strata = new Strata(destructible, { directory, cache: new Cache })
        await strata.open()
        const gathered = [], trampoline = new Trampoline
        const iterator = skip(strata, set.reverse(), {
            nullify: key => { return { key: null, parts: null } }, extractor: $ => $, slice: 2
        })
        while (!iterator.done) {
            iterator.next(trampoline, items => {
                for (const item of items) {
                    gathered.push(item)
                }
            })
            while (trampoline.seek()) {
                await trampoline.shift()
            }
        }
        okay(gathered, expected.reverse(), 'reversed')
        strata.destructible.destroy().rejected
    }

    {
        const destructible = new Destructible([ 'partial' ])
        const strata = new Strata(destructible, { directory, cache: new Cache })
        await strata.open()
        const gathered = [], trampoline = new Trampoline
        const iterator = skip(strata, [ [ 'a' ], [ 'b' ], [ 'c' ], [ 'm' ], [ 'n' ] ], {
            group: (sought, key) => {
                return partial(sought[0], key[0]) == 0
            }
        })
        while (!iterator.done) {
            iterator.next(trampoline, items => {
                for (const item of items) {
                    gathered.push(item)
                }
            })
            while (trampoline.seek()) {
                await trampoline.shift()
            }
        }
        okay(gathered, [
            { key: [ 'a', 0 ], parts: [ [ 'a', 0 ] ], sought: { key: [ 'a' ], value: [ 'a' ] }, index: 0 },
            { key: [ 'a', 1 ], parts: [ [ 'a', 1 ] ], sought: { key: [ 'a' ], value: [ 'a' ] }, index: 1 },
            { key: [ 'b', 0 ], parts: [ [ 'b', 0 ] ], sought: { key: [ 'b' ], value: [ 'b' ] }, index: 0 },
            { key: [ 'c', 0 ], parts: [ [ 'c', 0 ] ], sought: { key: [ 'c' ], value: [ 'c' ] }, index: 0 },
            { key: [ 'c', 1 ], parts: [ [ 'c', 1 ] ], sought: { key: [ 'c' ], value: [ 'c' ] }, index: 1 },
            { key: [ 'c', 2 ], parts: [ [ 'c', 2 ] ], sought: { key: [ 'c' ], value: [ 'c' ] }, index: 2 },
            { key: [ 'm', 0 ], parts: [ [ 'm', 0 ] ], sought: { key: [ 'm' ], value: [ 'm' ] }, index: 0 },
            { key: [ 'm', 2 ], parts: [ [ 'm', 2 ] ], sought: { key: [ 'm' ], value: [ 'm' ] }, index: 1 },
            { key: [ 'm', 3 ], parts: [ [ 'm', 3 ] ], sought: { key: [ 'm' ], value: [ 'm' ] }, index: 2 },
            { key: null, parts: null, sought: { key: [ 'n' ], value: [ 'n' ] }, index: -1 }
        ], 'partial')
        strata.destructible.destroy().rejected
    }
})

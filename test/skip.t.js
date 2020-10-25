require('proof')(6, async okay => {
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
      '0.0': [ [ '0.1', null ], [ '1.1', [ 'd', 0 ] ], [ '1.3', [ 'g', 0 ] ] ],
      '0.1': [ [ 'right', 'd' ], [ 'insert', 0, [ 'a', 0 ] ], [ 'insert', 1, [ 'a', 1 ] ],
        [ 'insert', 2, [ 'b', 0 ] ], [ 'insert', 3, [ 'c', 0 ] ], [ 'insert', 4, [ 'c', 1 ] ] ],
      '1.1': [ [ 'right', [ 'g', 0 ] ], [ 'insert', 0, [ 'd', 0 ] ], [ 'insert', 1, [ 'e', 0 ] ] ],
      '1.3': [ [ 'insert', 0, [ 'g', 0 ] ], [ 'insert', 1, [ 'h', 0 ] ], [ 'insert', 2, [ 'j', 0 ] ], [ 'delete', 0 ] ]
    })
    const skip = require('../skip')

    const set = [ 'a', 'b', 'c', 'e', 'f', 'g', 'j' ].map(letter => [ letter, 0 ])
    const expected = set.map(letter => {
        return {
            key: letter,
            parts: /^f|g$/.test(letter[0]) ? null : [ letter ],
            value: letter
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
        const destructible = new Destructible([ 'defaults' ])
        const strata = new Strata(destructible, { directory, cache: new Cache })
        await strata.open()
        const gathered = [], trampoline = new Trampoline
        const iterator = skip(strata, set, {
            nullify: key => { return { key, parts: null } }, extractor: $ => $, slice: 2
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
        okay(gathered, expected, 'defaults')
        strata.destructible.destroy().rejected
    }

    {
        const destructible = new Destructible([ 'defaults' ])
        const strata = new Strata(destructible, { directory, cache: new Cache })
        await strata.open()
        const gathered = [], trampoline = new Trampoline
        const iterator = skip(strata, set.reverse(), {
            nullify: key => { return { key, parts: null } }, extractor: $ => $, slice: 2
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
        const iterator = skip(strata, [ [ 'a' ], [ 'b' ], [ 'c' ] ], {
            filter: (sought, items, index) => {
                return partial(sought, items[index].key[0]) == 0
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
            { key: [ 'a', 0 ], parts: [ [ 'a', 0 ] ], value: [ 'a' ] },
            { key: [ 'a', 1 ], parts: [ [ 'a', 1 ] ], value: [ 'a' ] },
            { key: [ 'b', 0 ], parts: [ [ 'b', 0 ] ], value: [ 'b' ] },
            { key: [ 'c', 0 ], parts: [ [ 'c', 0 ] ], value: [ 'c' ] },
            { key: [ 'c', 1 ], parts: [ [ 'c', 1 ] ], value: [ 'c' ] }
        ], 'partial')
        strata.destructible.destroy().rejected
    }
})

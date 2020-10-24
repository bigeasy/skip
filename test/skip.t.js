require('proof')(5, async okay => {
    const path = require('path')

    const Strata = require('b-tree')
    const Cache = require('b-tree/cache')
    const Trampoline = require('reciprocate')
    const Destructible = require('destructible')

    const utilities = require('b-tree/utilities')

    const directory = path.resolve(__dirname, './tmp/skip')

    await utilities.reset(directory)
    await utilities.serialize(directory, {
      '0.0': [ [ '0.1', null ], [ '1.1', 'd' ], [ '1.3', 'g' ] ],
      '0.1': [ [ 'right', 'd' ], [ 'insert', 0, 'a' ], [ 'insert', 1, 'b' ], [ 'insert', 2, 'c' ] ],
      '1.1': [ [ 'right', 'g' ], [ 'insert', 0, 'd' ], [ 'insert', 1, 'e' ] ],
      '1.3': [ [ 'insert', 0, 'g' ], [ 'insert', 1, 'h' ], [ 'insert', 2, 'j' ], [ 'delete', 0 ] ]
    })
    const skip = require('../skip')

    const set = [ 'a', 'b', 'c', 'e', 'f', 'g', 'j' ]
    const expected = set.map(letter => {
        return {
            key: letter,
            parts: /^f|g$/.test(letter) ? null : [ letter ],
            value: letter
        }
    })

    {
        const destructible = new Destructible([ 'defaults' ])
        const strata = new Strata(destructible, { directory, cache: new Cache })
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
        okay(gathered, expected, 'specified')
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
})

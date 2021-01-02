require('proof')(6, async okay => {
    const skip = require('../strata')

    const path = require('path')

    const ascension = require('ascension')
    const whittle = require('whittle')
    const Strata = require('b-tree')
    const FileSystem = require('b-tree/filesystem')
    const Magazine = require('magazine')
    const Trampoline = require('reciprocate')
    const Destructible = require('destructible')
    const Turnstile = require('turnstile')

    const utilities = require('b-tree/utilities')

    const directory = path.resolve(__dirname, './tmp/skip')

    const comparator = ascension([ String, Number ])
    const partial = whittle(ascension([ String ]), key => key.slice(0, 1))

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
            key: letter,
            value: letter,
            items: /^f|g$/.test(letter[0]) ? [] : [{ key: letter, parts: [ letter ] }]
        }
    })

    {
        const destructible = new Destructible($ => $(), 'defaults')
        const turnstile = new Turnstile(destructible.durable($ => $(), 'turnstile'))
        const pages = new Magazine
        const handles = new FileSystem.HandleCache(new Magazine)
        const storage = new FileSystem(directory, handles)
        destructible.rescue($ => $(), 'test', async () => {
            const strata = await Strata.open(destructible.durable($ => $(), 'strata'), { storage, pages, turnstile, compare: comparator })
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
            destructible.destroy()
        })
        await destructible.promise
        await handles.shrink(0)
    }

    {
        const destructible = new Destructible($ => $(), 'specified')
        const turnstile = new Turnstile(destructible.durable($ => $(), 'turnstile'))
        const pages = new Magazine
        const handles = new FileSystem.HandleCache(new Magazine)
        const storage = new FileSystem(directory, handles)
        destructible.rescue($ => $(), 'test', async () => {
            const strata = await Strata.open(destructible.durable($ => $(), 'strata'), { storage, pages, turnstile, compare: comparator })
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
            destructible.destroy()
        })
        await destructible.promise
        await handles.shrink(0)
    }

    {
        const destructible = new Destructible($ => $(), 'reversed')
        const turnstile = new Turnstile(destructible.durable($ => $(), 'turnstile'))
        const pages = new Magazine
        const handles = new FileSystem.HandleCache(new Magazine)
        const storage = new FileSystem(directory, handles)
        destructible.rescue($ => $(), 'test', async () => {
            const strata = await Strata.open(destructible.durable($ => $(), 'strata'), { storage, pages, turnstile, compare: comparator })
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
            destructible.destroy()
        })
        await destructible.promise
        await handles.shrink(0)
    }

    {
        const destructible = new Destructible($ => $(), 'partial')
        const turnstile = new Turnstile(destructible.durable($ => $(), 'turnstile'))
        const pages = new Magazine
        const handles = new FileSystem.HandleCache(new Magazine)
        const storage = new FileSystem(directory, handles)
        destructible.rescue($ => $(), 'test', async () => {
            const strata = await Strata.open(destructible.durable($ => $(), 'strata'), { storage, pages, turnstile, compare: comparator })
            const gathered = [], trampoline = new Trampoline
            const iterator = skip(strata, [ [ 'a' ], [ 'b' ], [ 'c' ], [ 'm' ], [ 'n' ] ], {
                group: (sought, key) => {
                    return partial(sought, key) == 0
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
                {
                    key: [ 'a' ],
                    value: [ 'a' ],
                    items: [{
                        key: [ 'a', 0 ], parts: [[ 'a', 0 ]]
                    }, {
                        key: [ 'a', 1 ], parts: [[ 'a', 1 ]]
                    }]
                }, {
                    key: [ 'b' ],
                    value: [ 'b' ],
                    items: [{ key: [ 'b', 0 ], parts: [[ 'b', 0 ]] }]
                 }, {
                    key: [ 'c' ],
                    value: [ 'c' ],
                    items: [{
                        key: [ 'c', 0 ], parts: [ [ 'c', 0 ] ]
                    }, {
                        key: [ 'c', 1 ], parts: [ [ 'c', 1 ] ]
                    }, {
                        key: [ 'c', 2 ], parts: [ [ 'c', 2 ] ],
                    }],
                }, {
                    key: [ 'm' ],
                    value: [ 'm' ],
                    items: [{
                        key: [ 'm', 0 ], parts: [ [ 'm', 0 ] ],
                    }, {
                        key: [ 'm', 2 ], parts: [ [ 'm', 2 ] ],
                    }, {
                        key: [ 'm', 3 ], parts: [ [ 'm', 3 ] ]
                    }]
                }, {
                   key: [ 'n' ], value: [ 'n' ], items: []
               }
            ], 'partial')
            destructible.destroy()
        })
        await destructible.promise
        await handles.shrink(0)
    }
})

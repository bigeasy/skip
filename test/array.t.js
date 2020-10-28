require('proof')(5, okay => {
    const skip = { array: require('../array') }

    const assert = require('assert')

    const ascension = require('ascension')
    const Trampoline = require('reciprocate')

    const letters = [ 'a', 'b', 'c', 'f', 'g', 'j', 'k', 'l' ]
    const comparator = (left, right) => (left > right) - (left < right)

    const set = [ 'b', 'c', 'e', 'j', 'm' ]

    const expected = set.map(letter => {
        return {
            key: letter,
            parts: /^e|m$/.test(letter) ? null : [ letter ],
            value: letter,
            index: /^e|m$/.test(letter) ? -1 : 0
        }
    })

    {
        const trampoline = new Trampoline
        const array = letters.map(letter => {
            return { key: letter, parts: [ letter ] }
        })
        const iterator = skip.array(comparator, array, set)
        const gathered = []
        while (! iterator.done) {
            iterator.next(trampoline, items => {
                okay(items.length, set.length, 'default slice limit')
                for (const item of items) {
                    gathered.push(item)
                }
            })
        }
        okay(!trampoline.seek(), 'defaults no async actions')
        okay(gathered, expected, 'defaults')
    }

    {
        const trampoline = new Trampoline
        const array = letters.map(letter => {
            return { key: [ letter, 0 ], parts: [ letter ] }
        })
        array.splice(1, 0, {
            key: [ 'a', 1 ], parts: [ 'a' ]
        })
        const comparator = ascension([ String, Number ], object => object)
        const partial = ascension([ String ], object => object)
        const iterator = skip.array(comparator, array, [ [ 'a' ], [ 'c' ], [ 'd' ] ], {
            group: (sought, items, index) => {
                return partial(sought[0], items[index].key[0]) == 0
            }
        })
        const gathered = []
        while (! iterator.done) {
            iterator.next(trampoline, items => {
                for (const item of items) {
                    gathered.push(item)
                }
            })
        }
        okay(!trampoline.seek(), 'partial no async actions')
        okay(gathered, [
            { key: [ 'a', 0 ], parts: [ 'a' ], value: [ 'a' ], index: 0, },
            { key: [ 'a', 1 ], parts: [ 'a' ], value: [ 'a' ], index: 1 },
            { key: [ 'c', 0 ], parts: [ 'c' ], value: [ 'c' ], index: 0 },
            { key: [ 'd' ], parts: null, value: [ 'd' ], index: -1 }
        ], 'partial')
    }
})

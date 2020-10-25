require('proof')(3, okay => {
    const skip = { array: require('../array') }

    const assert = require('assert')

    const Trampoline = require('reciprocate')

    const array = [ 'a', 'b', 'c', 'f', 'g', 'j', 'k', 'l' ].map(letter => {
        return { key: letter, parts: [ letter ] }
    })
    const comparator = (left, right) => (left > right) - (left < right)

    const set = [ 'b', 'c', 'e', 'j', 'm' ]

    const expected = set.map(letter => {
        return { key: letter, parts: /^e|m$/.test(letter) ? null : [ letter ], value: letter }
    })

    {
        const trampoline = new Trampoline
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
})

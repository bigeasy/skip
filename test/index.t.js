require('proof')(2, okay => {
    const skip = require('..')
    okay(typeof skip.strata == 'function', 'export strata implementation')
    okay(typeof skip.array == 'function', 'export array implementation')
})

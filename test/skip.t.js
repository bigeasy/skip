require('proof')(1, async okay => {
    const skip = require('..')
    okay(skip, 'require')
})

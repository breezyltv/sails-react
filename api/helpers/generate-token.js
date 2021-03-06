const crypto = require('crypto');
const moment = require('moment-timezone');

module.exports = {
    sync: true, // this is a synchronous helper

    friendlyName: 'Generate token',

    description: 'Generate generic token for generic use, generically. (64 characters)',

    inputs: {
        extra: {
            type: 'string',
            description: 'A bit of random, extra bits to change up the hash.',
            defaultsTo: 'Evil will always triumph, because good is dumb. -Lord Helmet'
        }
    },

    exits: {},

    fn: function(inputs, exits) {
        return exits.success(
            crypto.createHmac('sha256', sails.config.session.secret)
            .update(
                crypto.randomBytes(21) // cryptographically-secure random characters
                + moment(new Date()).format() // throw in the current time stamp
                + 'I am a tea pot' // the best HTTP status code
                + inputs.extra // an optional way to add a bit more randomness to the mix
                + crypto.randomBytes(21)
            )
            .digest('hex')
        );
    }
};


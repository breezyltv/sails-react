const scrypt = require('scrypt-kdf');
const md5 = require('md5'); // NEVER USE FOR PASSWORDS!

async function hashPassword(pass) {
    const hash = await scrypt.kdf(pass, {logN: 15});

    return hash.toString('base64');
}

async function updatePassword(password) {
    // "binary to ASCII" aka base64
    // btoa('scrypt') = c2NyeXB0
    if (password && password.length > 1 && password.substr(0, 8) !== 'c2NyeXB0') {
        password = await hashPassword(password);
    }

    return password;
}

function getGravatarUrl(email) {
    return 'https://www.gravatar.com/avatar/' + md5(email);
}

function forceUppercaseOnFirst(name) {
    return name.trim().charAt(0).toUpperCase() + name.trim().slice(1);
}

module.exports = {
    primaryKey: 'id',

    attributes: {
        id: {
            type: 'string',
            columnType: 'varchar(36)',
            required: true
        },

        role: {
            type: 'string',
            isIn: [
                'user',
                'manager',
                'admin'
            ],
            required: true,
            columnType: 'varchar(7)'
        },

        email: {
            type: 'string',
            isEmail: true,
            required: true,
            unique: true,
            columnType: 'varchar(191)'
        },

        firstName: {
            type: 'string',
            allowNull: true,
            columnType: 'varchar(70)'
        },

        lastName: {
            type: 'string',
            allowNull: true,
            columnType: 'varchar(70)'
        },

        password: {
            type: 'string',
            allowNull: true,
            columnType: 'varchar(191)',
            // see: https://sailsjs.com/documentation/reference/waterline-orm/queries/decrypt
            // You will need to "decrypt" the user object before you can check if the password is valid.
            // encrypt: true // currently, does not work as intended, as password is encrypted before we can hash it
        },

        verificationKey: { // placeholder for something like email verification
            type: 'string',
            allowNull: true,
            columnType: 'varchar(191)'
        },

        avatar: {
            type: 'string',
            isURL: true,
            columnType: 'varchar(191)'
        },

        isGravatar: {
            type: 'boolean',
            defaultsTo: true
        },

        deletedBy: {
            model: 'user'
        },

        deletedAt: {
            type: 'ref',
            columnType: 'datetime'
        },

        createdAt: {
            type: 'ref',
            columnType: 'datetime',
            autoCreatedAt: true
        },

        updatedAt: {
            type: 'ref',
            columnType: 'datetime',
            autoUpdatedAt: true
        }
    },

    fullName: (user) => {
        if (!user.firstName) {
            throw new Error('User has no firstName attribute.');
        }

        if (!user.lastName) {
            throw new Error('User has no lastName attribute.');
        }

        return user.firstName + ' ' + user.lastName;
    },

    customToJSON: function() {
        return _.omit(this, [
            'password',
            'verificationKey',
            'deletedAt',
            'deletedBy'
        ]);
    },

    doPasswordsMatch: (raw, hashed) => {
        if (!raw || !hashed) {
            throw new Error('Both "raw" and "hashed" passwords are required.');
        }

        const hashBuffer = Buffer.from(hashed, 'base64');

        return scrypt.verify(hashBuffer, raw).then((isAMatch) => isAMatch);
    },

    beforeCreate: async function(user, next) {
        const email = user.email.toLowerCase().trim();

        user.id = sails.helpers.generateUuid();
        user.email = email;
        user.avatar = getGravatarUrl(email);
        user.firstName = forceUppercaseOnFirst(user.firstName);
        user.lastName = forceUppercaseOnFirst(user.lastName);
        user.password = await updatePassword(user.password);

        return next();
    },

    beforeUpdate: async function(user, next) {
        const email = user.email.toLowerCase().trim();

        user.email = email;
        user.avatar = getGravatarUrl(email);
        user.firstName = forceUppercaseOnFirst(user.firstName);
        user.lastName = forceUppercaseOnFirst(user.lastName);

        if (user.password && user.password !== '') {
            user.password = await updatePassword(user.password);
        }

        return next();
    }
};

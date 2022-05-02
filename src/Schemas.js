const mongoose = require('mongoose');
const { Schema } = mongoose;

    // SCHEMA DEFINITIONS
// User Schema
const UserSchema = new Schema({
    uuid: {
        type: String,
        required: true,
        unique: true
    },
    accountHandle: {
        type: String,
        required: true,
        unique: true
    },
    displayName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    creationTime: {
        type: Date,
        required: true
    },
    photoURL: {
        type: String,
        required: false,
        default: undefined
    },
    isAdministrator: {
        type: Boolean,
        required: false,
        default: false
    }
});

    // OBJECT DEFINITIONS
let Users;

    // FUNCTION DEFINITIONS
// Connect to the Mongo database.
module.exports.connect = (conString) => {
    return new Promise((resolve, reject) => { 
        let db = mongoose.createConnection(conString, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        });

        db.on('error', err => {
            reject(err);
        });

        db.once('open', () => {

            Users = db.model('Users', UserSchema);

            resolve();

        });
    });
};

// Add new user
module.exports.addUser = (userData) => {
    return new Promise((resolve, reject) => {
        let _user = new Users(userData);
        _user.save(err => {
            if (err) {
                if (err.code == 11000) {
                    reject("A user with the provided account handle already exists.");
                } else {
                    reject("There was an unknown error saving the user.");
                }
            } else {
                resolve(_user);
            }
        })
    });
}
const res = require('express/lib/response');
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
    profileBio: {
        type: String,
        required: false,
        default: ""
    },
    isPrivate: {
        type: Boolean,
        required: false,
        default: false
    },
    isVerified: {
        type: Boolean,
        required: false,
        default: false
    },
    isAdministrator: {
        type: Boolean,
        required: false,
        default: false
    }
});

// Posts Schema
const PostSchema = new Schema({
    poster: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Users'
    },
    text: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false,
        default: null
    },
    postDate: {
        type: Date,
        required: false,
        default: Date.now()
    }
});

// Follows Schema
const FollowSchema = new Schema({
    follower: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Users"
    },
    followed: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Users"
    },
    dateFollowed: {
        type: Date,
        required: false,
        default: Date.now()
    }
});

    // OBJECT DEFINITIONS
let Users;
let Posts;
let Follows;

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
            Posts = db.model("Posts", PostSchema);
            Follows = db.model("Follows", FollowSchema);

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

// Get user by Firebase UUID.
module.exports.getUserByUUID = (UUID) => {
    return new Promise((resolve, reject) => {
        Users.findOne({ uuid: UUID }).exec().then((user) => {
            resolve(user);
        }).catch(err => reject(err));
    });
}

// Get user profile details
module.exports.getUserProfileById = (mongoId) => {
    return new Promise((resolve, reject) => {
        Users.findOne({ _id: mongoId }).select('_id accountHandle displayName photoURL profileBio isPrivate isVerified').exec().then(profile => resolve(profile)).catch(err => reject(err));
    });
}

// Get user profile counts
module.exports.getUserProfileCounts = async (userId) => {
    let counts = {
        posts: undefined,
        followers: undefined,
        following: undefined
    };

    counts.posts = await Posts.countDocuments({ poster: userId }).exec();
    counts.followers = await Follows.countDocuments({ followed: userId }).exec();
    counts.following = await Follows.countDocuments({ follower: userId }).exec();

    return counts;
}

// Get all posts by user.
module.exports.getPostsByUser = (userId) => {
    return new Promise((resolve, reject) => {
        Posts.find({ poster: userId }).sort("-postDate").exec().then((posts) => {
            resolve(posts);
        }).catch(err => reject(err));
    });
}

// Check if a user follow relationship exists
module.exports.checkIfFollowed = (followerId, followedId) => {
    return new Promise((resolve, reject) =>{ 
        Follows.exists({ follower: followerId, followed: followedId }).then(status => resolve(status)).catch(err => reject(err));
    });
}
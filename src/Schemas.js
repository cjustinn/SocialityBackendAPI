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

// Post Like Schema
const LikeSchema = new Schema({
    likedBy: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Users"
    },
    post: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Posts"
    },
    dateLiked: {
        type: Date,
        required: false,
        default: Date.now()
    }
});

    // OBJECT DEFINITIONS
let Users;
let Posts;
let Follows;
let Likes;

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
            Likes = db.model("Likes", LikeSchema);

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

// Create a new follow relationship
module.exports.addFollow = (followData) => {
    return new Promise((resolve, reject) => {
        let followRelationship = new Follows(followData);
        followRelationship.save(err => {
            if (err) {
                reject(err);
            } else { resolve(followRelationship) }
        });
    });
}

// Remove a follow relationship
module.exports.removeFollow = (followedId, followerId) => {
    return new Promise((resolve, reject) => {
        Follows.deleteOne({ follower: followerId, followed: followedId }).exec().then(() => {
            resolve(`Successfully removed the follow relationship`);
        }).catch(err => reject(err));
    })
}

// Check if a user follow relationship exists
module.exports.checkIfFollowed = (followerId, followedId) => {
    return new Promise((resolve, reject) =>{ 
        Follows.exists({ follower: followerId, followed: followedId }).then(status => resolve(status)).catch(err => reject(err));
    });
}

// Create a post
module.exports.addPost = (postData) => {
    return new Promise((resolve, reject) => {
        let post = new Posts(postData);
        post.save(err => {
            if (err) {
                reject(err);
            } else {
                resolve(post);
            }
        });
    });
}

// Get post data
module.exports.getPost = (postId) => {
    return new Promise((resolve, reject) => {
        Posts.findOne({ _id: postId }).exec().then(post => resolve(post)).catch(err => reject(err));
    });
}

// Create a like
module.exports.addLike = (likeData) => {
    return new Promise((resolve, reject) => {
        let like = new Likes(likeData);
        like.save(err => {
            if (err) {
                reject(err);
            } else {
                resolve(like);
            }
        })
    });
}

// Get all likes for a post
module.exports.getLikesByPost = (postId) => {
    return new Promise((resolve, reject) => {
        Likes.find({ post: postId }).sort('-dateLiked').exec().then(postLikes => resolve(postLikes)).catch(err => reject(err));
    });
}

// Get likes by user.
module.exports.getLikesByUser = (userId) => {
    return new Promise((resolve, reject) => {
        Likes.find({ likedBy: userId }).sort('-dateLiked').exec().then(userLikes => resolve(userLikes)).catch(err => reject(err));
    });
}

// Remove a like
module.exports.removeLike = (likeUserId, postId) => {
    return new Promise((resolve, reject) => {
        Likes.deleteOne({ likedBy: likeUserId, post: postId }).exec().then(() => {
            resolve(`Successfully removed like.`);
        }).catch(err => reject(err));
    });
}
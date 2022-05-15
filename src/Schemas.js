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

// Follow Request Schema
const FollowRequestSchema = new Schema({
    requester: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Users"
    },
    target: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "Users"
    },
    dateRequested: {
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
let FollowRequests;

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
            FollowRequests = db.model("FollowRequests", FollowRequestSchema);

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
        Follows.exists({ follower: followerId, followed: followedId }).then(status => resolve(status ? true : false)).catch(err => reject(err));
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

// Count likes for post.
module.exports.countLikesByPost = (postId) => {
    return new Promise((resolve, reject) => {
        Likes.countDocuments({ post: postId }).exec().then(count => resolve(count)).catch(err => reject(err));
    });
}

// Get all posts by user.
module.exports.getPostsByUser = (userId) => {
    return new Promise(async (resolve, reject) => {
        let posts = [];
        let finalisedPosts = [];

        posts = await Posts.find({ poster: userId }).sort("-postDate").populate('poster', [ 'displayName', 'photoURL', '_id', 'accountHandle', 'isVerified' ]).exec().then((userPosts) => {
            return userPosts;
        }).catch(err => { return err });

        for (let i = 0; i < posts.length; i++) {

            finalisedPosts.push({ ...posts[i]._doc, likes: await this.countLikesByPost(posts[i]._doc._id) });

        }
        
        resolve(finalisedPosts);
    });
}

// Check if post is liked by user.
module.exports.checkIfPostLiked = (userId, postId) => {
    return new Promise((resolve, reject) => {
        Likes.exists({ likedBy: userId, post: postId }).exec().then(status => resolve(status)).catch(err => reject(err));
    });
}

// Get all followers of target.
module.exports.getFollowers = (target) => {
    return new Promise((resolve, reject) => {
        Follows.find({ followed: target }).sort('-dateFollowed').populate('follower', [ '_id', 'displayName', 'photoURL', 'accountHandle', 'isVerified' ]).exec().then(followers => {
            resolve(followers);
        }).catch(err => reject(err));
    });
}

// Get all users followed by target.
module.exports.getFollowing = (target) => {
    return new Promise((resolve, reject) => {
        Follows.find({ follower: target }).sort('-dateFollowed').populate('followed', [ '_id', 'displayName', 'photoURL', 'accountHandle', 'isVerified' ]).exec().then(following => {
            resolve(following);
        }).catch(err => reject(err));
    });
}

// Create new follow request.
module.exports.addFollowRequest = (requestData) => {
    return new Promise((resolve, reject) => {
        let req = new FollowRequests(requestData);
        req.save(err => {
            if (err) {
                reject(err);
            } else {
                resolve(req);
            }
        })
    });
}

// Remove follow request
module.exports.removeFollowRequest = (requestedId, targetId) => {
    return new Promise((resolve, reject) => {
        FollowRequests.deleteOne({ requester: requestedId, target: targetId }).exec().then(() => {
            resolve(`Successfully removed the request.`);
        }).catch(err => reject(err));
    });
}

// Get follow requests by user.
module.exports.getFollowRequestsForUser = (userId) => {
    return new Promise((resolve, reject) => {
        FollowRequests.find({ target: userId }).sort('-dateRequested').populate('requester', [ '_id', 'displayName', 'accountHandle', 'isVerified' ]).exec().then(requests => {
            resolve(requests);
        }).catch(err => reject(err));
    });
}

// Check status of follow request for the user.
module.exports.checkIfFollowRequested = (requesterId, targetId) => {
    return new Promise((resolve, reject) =>{
        FollowRequests.exists({ requester: requesterId, target: targetId }).then(status => resolve(status ? true : false)).catch(err => reject(err));
    });
}

module.exports.getFollowRequestById = (reqId) => {
    return new Promise((resolve, reject) => {
        FollowRequests.findOne({ _id: reqId }).exec().then(req => resolve(req)).catch(err => reject(err));
    });
}

// Approve a follow request.
module.exports.approveFollowRequest = async (requestId) => {
    let req = await this.getFollowRequestById(requestId);
    
    await this.addFollow({
        follower: req.requester,
        followed: req.target
    });

    await this.removeFollowRequest(req.requester, req.target);

    return `Successfully approved the follow request.`;
}

// Check if an account handle is being used.
module.exports.accountHandleInUse = (handle) => {
    return new Promise((resolve, reject) => {
        Users.exists({ accountHandle: handle }).exec().then(status => resolve(status ? true : false)).catch(err => reject(err));
    });
}

// Delete a post.
module.exports.removePost = postId => {
    return new Promise((resolve, reject) => {
        Posts.deleteOne({ _id: postId }).exec().then(() => {
            resolve(`Successfully deleted the post.`);
        }).catch(err => reject(err));
    });
}

// Update the user profile.
module.exports.updateUser = (uid, userData) => {
    return new Promise((resolve, reject) => {
        Users.updateOne({ _id:  uid }, { $set: userData }).exec().then(updatedUser => {
            resolve(updatedUser);
        }).catch(err => reject(err));
    });
}

// Select 'postCount' amount of random posts from the database.
module.exports.selectRandomPosts = async (uid, postCount) => {
    let followed = await this.getFollowing(uid);
    return Users.aggregate().sample(postCount);
}
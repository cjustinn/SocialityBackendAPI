const Express = require('express');
const cors = require('cors');

const app = Express();
app.use(cors());
app.use(Express.json());

require('dotenv').config();

const Database = require('./Schemas');
const PORT = process.env.PORT || 8080;

// Main entry point.
app.get('/', (req, res) => {
    res.status(200).json({ message: `API is listening.` });
});

// User routes.
app.post('/api/users', (req, res) => {
    if (!req.body.userData) {
        console.log("No request data received.");
        res.status(400).json({ error: `You must provide user account data.` });
    } else {
        console.log("data received");
        Database.addUser(req.body.userData).then((result) => {

            res.status(201).json({ message: `Your account was registered successfully.`, data: result });

        }).catch( err => res.status(500).json({ error: err }));
    }
});

app.get('/api/users/:id', (req, res) => {
    const { id } = req.params;

    if (!id) { res.status(400).json({ error: "You must provide a user Firebase UUID." }); }
    else {

        Database.getUserByUUID(id).then(u => res.status(200).json({ message: "Found the target user!", data: u })).catch(err => res.status(500).json({ error: err }));

    }
});

// Profile Routes
app.get('/api/profile/:id', (req, res) => {
    const { id } = req.params;

    Database.getUserProfileById(id).then(profile => {
        res.status(200).json({ message: `Successfully retrieved the target's profile details.`, data: profile });
    }).catch(err => res.status(500).json({ error: err }));
});

app.get('/api/profile/counts/:id', (req, res) => {
    const { id } = req.params;

    Database.getUserProfileCounts(id).then((counts) => {
        res.status(200).json({ message: `Successfully retrieved target profile counts.`, data: counts });
    }).catch(err => res.status(500).json({ error: err }));
});

// Posts Routes
app.post('/api/posts', (req, res) => {
    if (!req.body.postData) {
        res.status(400).json({ error: `You must provide post data.` });
    } else {
        Database.addPost(req.body.postData).then(post => {
            res.status(201).json({ message: `Successfully created the post.`, data: post });
        }).catch(err => res.status(500).json({ error: err }));
    }
});

app.get('/api/posts/user/:id', async (req, res) => {
    const { id } = req.params;

    Database.getPostsByUser(id).then(posts => {
        res.status(200).json({ message: `Successfully retrieved all user posts.`, data: posts });
    }).catch(err => res.status(500).json({ error: err }));
});

app.get('/api/posts/single/:id', (req, res) => {
    const { id } = req.params;

    Database.getPost(id).then(post => {
        res.status(200).json({ message: `Successfully retrieved the post.`, data: post });
    }).catch(err => res.status(500).json({ error: err }));
});

// Follow Routes
app.get('/api/follow/status', (req, res) => {
    const { target, current } = req.query;

    if (!target || !current) {
        res.status(400).json({ error: `You must provide a Mongo ObjectId value for both the follower and the followee.` });
    } else {

        Database.checkIfFollowed(current, target).then(status => {
            res.status(200).json({ message: `Successfully checked user follow relationship for the provided users.`, data: status });
        }).catch(err => res.status(500).json({ error: err }));

    }
});

app.post('/api/follow', (req, res) => {
    if (!req.body.followData) {
        res.status(400).json({ error: `You must provide data for the follow relationship.` })
    } else {

        Database.addFollow(req.body.followData).then(newFollow => {
            res.status(201).json({ message: `Successfully created the follow relationship.`, data: newFollow });
        }).catch(err => res.status(500).json({ error: err }));

    }
});

app.delete('/api/follow', (req, res) => {
    const { following, follower } = req.query;

    if (!following || !follower) {
        res.status(400).json({ error: `You must provide both a follower and a followee.` });
    } else {

        Database.removeFollow(following, follower).then(result => {
            res.status(200).json({ message: result });
        }).catch(err => res.status(500).json({ error: err }));

    }
});

// Like Routes
app.post('/api/likes', (req, res) => {
    if (!req.body.likeData) {
        res.status(400).json({ error: `You must provide like data.` });
    } else {
        Database.addLike(req.body.likeData).then(like => {
            res.status(201).json({ message: `Successfully registered the new like.`, data: like });
        }).catch(err => res.status(500).json({ error: err }));
    }
});

app.get('/api/likes', (req, res) => {
    const { type, target } = req.query;
    if (!type || !target) {
        res.status(400).json({ error: `You must provide both a type and a target id.` });
    } else {
        if (type.toLowerCase() !== `post` && type.toLowerCase() !== `user`) {
            res.status(400).json({ error: `Valid type options are 'post' or 'user'.` });
        } else {

            if (type === 'post') {
                Database.getLikesByPost(target).then(likes => {
                    res.status(200).json({ message: `Successfully retrieved likes for target post.`, data: likes });
                }).catch(err => res.status(500).json({ error: err }));
            } else {
                Database.getLikesByUser(target).then(likes => {
                    res.status(200).json({ message: `Successfully retrieved likes made by the target user.`, data: likes });
                }).catch(err => res.status(500).json({ error: err }));
            }

        }
    }
});

app.get('/api/likes/status', (req, res) => {
    const { user, post } = req.query;
    if (!user || !post) {
        res.status(400).json({ error: `You must provide both a post and a user ObjectId.` });
    } else {

        Database.checkIfPostLiked(user, post).then(status => {
            res.status(200).json({ message: `Successfully retrieved like status.`, data: status })
        }).catch(err => res.status(500).json({ error: err }));

    }
})

app.delete('/api/likes', (req, res) => {

    const { userId, postId } = req.query;
    
    Database.removeLike(userId, postId).then(() => {
        res.status(200).json({ message: `Successfully unliked the post.` });
    }).catch(err => res.status(500).json({ error: err }));

});

// Get the API server listening.
Database.connect(process.env.MONGO_URL).then(() => {
    app.listen(PORT, () => {
        console.log(`API now listening on port ${PORT}.`);
    })
}).catch(err => {
    console.log(`Failed to connect to the database: ${err}`);
})
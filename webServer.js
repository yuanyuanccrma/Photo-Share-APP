"use strict";

/* jshint node: true */

/*
 * This builds on the webServer of previous projects in that it exports the current
 * directory via webserver listing on a hard code (see portno below) port. It also
 * establishes a connection to the MongoDB named 'cs142project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch any file accessible
 * to the current user in the current directory or any of its children.
 *
 * This webServer exports the following URLs:
 * /              -  Returns a text status message.  Good for testing web server running.
 * /test          - (Same as /test/info)
 * /test/info     -  Returns the SchemaInfo object from the database (JSON format).  Good
 *                   for testing database connectivity.
 * /test/counts   -  Returns the population counts of the cs142 collections in the database.
 *                   Format is a JSON object with properties being the collection name and
 *                   the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the database.
 * /user/list     -  Returns an array containing all the User objects from the database.
 *                   (JSON format)
 * /user/:id      -  Returns the User object with the _id of id. (JSON format).
 * /photosOfUser/:id' - Returns an array with all the photos of the User (id). Each photo
 *                      should have all the Comments on the Photo (JSON format)
 *
 */

var mongoose = require('mongoose');
var async = require('async');


// Load the Mongoose schema for User, Photo, and SchemaInfo
var User = require('./schema/user.js');
var Photo = require('./schema/photo.js');
var SchemaInfo = require('./schema/schemaInfo.js');


var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var processFormBody = multer({storage: multer.memoryStorage()}).single('uploadedphoto');
var fs = require("fs");
var cs142password = require('./cs142password.js');

// XXX - Your submission should work without this line

mongoose.connect('mongodb://localhost/cs142project6');

// We have the express static module (http://expressjs.com/en/starter/static-files.html) do all
// the work for us.
app.use(express.static(__dirname));
app.use(session({secret: 'secretKey', resave: false, saveUninitialized: false}));
app.use(bodyParser.json());

app.get('/', function (request, response) {
    response.send('Simple web server of files from ' + __dirname);
});
/*
 * Use express to handle argument passing in the URL.  This .get will cause express
 * To accept URLs with /test/<something> and return the something in request.params.p1
 * If implement the get as follows:
 * /test or /test/info - Return the SchemaInfo object of the database in JSON format. This
 *                       is good for testing connectivity with  MongoDB.
 * /test/counts - Return an object with the counts of the different collections in JSON format
 */
app.get('/test/:p1', function (request, response) {
    
    // Express parses the ":p1" from the URL and returns it in the request.params objects.
    console.log('/test called with param1 = ', request.params.p1);

    var param = request.params.p1 || 'info';

    if (param === 'info') {
        // Fetch the SchemaInfo. There should only one of them. The query of {} will match it.
        SchemaInfo.find({}, function (err, info) {
            if (err) {
                // Query returned an error.  We pass it back to the browser with an Internal Service
                // Error (500) error code.
                console.error('Doing /user/info error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (info.length === 0) {
                // Query didn't return an error but didn't find the SchemaInfo object - This
                // is also an internal error return.
                response.status(500).send('Missing SchemaInfo');
                return;
            }
            // We got the object - return it in JSON format.
            console.log('SchemaInfo', info[0]);
            response.end(JSON.stringify(info[0]));
        });
    } else if (param === 'counts') {
        // In order to return the counts of all the collections we need to do an async
        // call to each collections. That is tricky to do so we use the async package
        // do the work.  We put the collections into array and use async.each to
        // do each .count() query.
        var collections = [
            {name: 'user', collection: User},
            {name: 'photo', collection: Photo},
            {name: 'schemaInfo', collection: SchemaInfo}
        ];
        async.each(collections, function (col, done_callback) {
            col.collection.count({}, function (err, count) {
                col.count = count;
                done_callback(err);
            });
        }, function (err) {
            if (err) {
                response.status(500).send(JSON.stringify(err));
            } else {
                var obj = {};
                for (var i = 0; i < collections.length; i++) {
                    obj[collections[i].name] = collections[i].count;
                }
                response.end(JSON.stringify(obj));
            }
        });
    } else {
        // If we know understand the parameter we return a (Bad Parameter) (400) status.
        response.status(400).send('Bad param ' + param);
    }
});


/*
 * URL /user/list - Return all the User object.
 */
app.get('/user/list', function (request, response) {
    if (!request.session ||!request.session.login_name) {
        response.status(401).send();
        return;
    }
  User.find(function (err, users) {
        if (err) {
            // Query returned an error.  We pass it back to the browser with an Internal Service
            // Error (500) error code.
            console.error('Doing /user/list error:', err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
        if (users === undefined) {
            // Query didn't return an error but didn't find the users object - This
            // is also an internal error return.
            response.status(500).send('Missing User List');
            return;
        } 
      var allUser = [];
      for(var i = 0; i < users.length; i++) {
          var temp = {};
          temp = {_id: users[i]._id, first_name: users[i].first_name, last_name: users[i].last_name};
          allUser.push(temp);
      }
      /*We got the object - return it in JSON format.*/
      response.status(200).send(JSON.stringify(allUser));
    });
});

/*
 * URL /user/:id - Return the information for User (id)
 */

app.get('/user/:id', function (request, response) {
    if (!request.session ||!request.session.user_id) {
            console.log('user detail: session  ', request.session);

        response.status(401).send();
        return;
    }
    var user_id = request.params.id;
    User.findOne({_id: user_id}, function (err, user) {
        if (user === undefined) {
            response.status(400).send('Bad param ' + user_id);
            return;
        }
        if (err) {
            console.error('Doing /user/' + user_id + 'error:', err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
        var property = JSON.parse(JSON.stringify(user));
        delete property.__v;
        delete property.login_name;
        delete property.password;
        delete property.password_digest;
        delete property.salt;
        response.status(200).send(JSON.stringify(property));
    });           
});

/*
 * URL /photosOfUser/:id - Return the Photos for User (id)
 */
app.get('/photosOfUser/:id', function (request, response) {
       if (!request.session ||!request.session.login_name) {
        response.status(401).send();
        return;
    }
    var user_id = request.params.id;
    Photo.find({user_id: user_id}, function (err, photos) {
        if (photos === undefined) {
           response.status(400).send('Bad param ' + user_id);
            return;
        }
        if (err) {
            console.error('Doing /photosOfUser/' + user_id + 'error:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }

        var Photo = JSON.parse(JSON.stringify(photos));
        async.each(Photo, function (photo, doneCallback) {
            delete photo.__v;
            async.each(photo.comments, function (comment, comment_callback) {
                var temp_user_id = comment.user_id;
                delete comment.user_id;
               User.findOne({_id: temp_user_id}, function(err, user) {
                    if (err) {
                        comment_callback(err);
                        return;
                    }
                    if (user.length === 0) {
                        response.status(400).send('Missing user id');
                        return;
                    }
                    comment.user = JSON.parse(JSON.stringify(user));
                    delete comment.user.occupation;
                    delete comment.user.description;
                    delete comment.user.location;
                    delete comment.user.__v;
                    delete comment.user.password;
                    delete comment.user.login_name;
                   delete comment.user.salt;
                   delete comment.user.password_digest;

                    comment_callback();
                });
            }, function (err) {
                doneCallback(err);
            });
        }, function (err) {
            if (err) {
                response.status(400).send(JSON.stringify(err));
            }
            response.end(JSON.stringify(Photo));
        });
    });
});
/*
 * URL /userinfo/ - Return the info for User 
 */
app.get('/userinfo', function (request, response) {
 
     User.find(function (err, users) {
            if (err) {
                console.error('Doing /user/list error:', err);
                response.status(500).send(JSON.stringify(err));
                return;
            }
            if (users.length === 0) {
                response.status(400).send('Missing User List');
                return;
            } 
          var all = [];
          var photoNum = {};
          var commentNum = {};
          for(var i = 0; i < users.length; i++) {
              var temp = {};
              temp = {_id: users[i]._id, first_name: users[i].first_name, last_name: users[i].last_name};
              all.push(temp);
          }
        Photo.find(function (error, photos) {
            if (error) {
                response.status(500).send(JSON.stringify(error));
                return;
            }
            if (photos.length === 0) {
                response.status(400).send('Missing Photos');
                return;
            }
            for(var i = 0; i < photos.length; i++) {
                var currentPhoto = photoNum[photos[i].user_id] || 0;
                photoNum[photos[i].user_id] = currentPhoto + 1;
                for (var j = 0; j < photos[i].comments.length; j++) {
                    var currentComment = commentNum[photos[i].comments[j].user_id] || 0;
                    commentNum[photos[i].comments[j].user_id] = currentComment + 1;
                }
            }
            for (i = 0; i < all.length; i++) {
                all[i].numPhotos = photoNum[all[i]._id];
                all[i].numComments = commentNum[all[i]._id];
            }
            var All  = JSON.parse(JSON.stringify(all));
            delete All.numPhotos;
            delete All.numComments;
          // We got the object - return it in JSON format.
          response.send(JSON.stringify(All));
        });
      });
});

//to log in
app.post('/admin/login', function (request, response) {

    var login_name = request.body.login_name;
    var passWord = request.body.password;
    request.session.login_name = login_name;
    User.findOne({login_name:login_name}, function(err, user) {
        if (!user) {
            response.status(400).send('Missing user with login_name ' + login_name);
            return;
        }
        if (!cs142password.doesPasswordMatch(user.password_digest, user.salt, passWord)) {
        console.log('password: ', passWord);
            response.status(400).send();
            return;
        }
        if (err) {
            console.error('Doing /user/' + login_name + 'error:', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        request.session.user_id = user._id;
        response.send(JSON.stringify(user));
    });
});
//to log out
app.post('/admin/logout', function (request, response) { 
        if (!request.session ||!request.session.login_name) {
        response.status(401).send();
        return;
    }
    request.session.destroy(function (err) { 
        console.error('no one is currently logged in');
        response.status(400).send(JSON.stringify(err));
        return;
    });
    response.status(200).send();
});

///commentsOfPhoto/:photo_id - Add a comment to the photo whose id is photo_id
app.post('/commentsOfPhoto/:photo_id', function(request, response) {
    if (!request.session || !request.session.login_name) {
        response.status(401).send();
        return;
    }
    var photo_id = request.params.photo_id;
    if (request.body.comment.length === 0) {
        response.status(400).send();
        return;
    }
    Photo.findOne({_id: photo_id}, function(err, photo) {
        if (err) {
            console.error('Doing /commentsOfPhoto/' + photo_id + ' error:', err);
            response.status(500).send(JSON.stringify(err));
            return;
        }
        if (!photo || photo.length === 0) {
            response.status(400).send('no photos' + photo_id);
            return;
        }
        var commentObj = {};
        commentObj.comment = request.body.comment;
        commentObj.user_id = request.session.user_id;
        commentObj.date_time = Date();
        photo.comments.push(commentObj);
        
        photo.save();
        response.status(200).send();
    });
});


//adding new photos 
app.post('/photos/new', function(request, response) {
    if (!request.session ||!request.session.login_name) {
        response.status(401).send();
        return;
    }
    processFormBody(request, response, function (err) {
            if (err || !request.file) {
                // XXX -  Insert error handling code here.
            response.status(400).send(JSON.stringify(err));
            return;
            }
            // request.file has the following properties of interest
            //      fieldname      - Should be 'uploadedphoto' since that is what we sent
            //      originalname:  - The name of the file the user uploaded
            //      mimetype:      - The mimetype of the image (e.g. 'image/jpeg',  'image/png')
            //      buffer:        - A node Buffer containing the contents of the file
            //      size:          - The size of the file in bytes

            // XXX - Do some validation here.
            // We need to create the file in the directory "images" under an unique name. We make
            // the original file name unique by adding a unique prefix with a timestamp.
            var timestamp = new Date().valueOf();
            var filename = 'U' +  String(timestamp) + request.file.originalname;

            fs.writeFile("./images/" + filename, request.file.buffer, function (err) {    
                Photo.create({file_name: filename, date_time: timestamp, user_id: request.session.user_id}, function() { 
                    if (err) {
                        response.status(400).send(JSON.stringify(err));
                        return;
                    } 
                    response.status(200).send();
                });
              // XXX - Once you have the file written into your images directory under the name
              // filename you can create the Photo object in the database
            });
        });
});

//add likes to photos
app.post('/likeVotes/:photo_id', function(request, response) {
    if (!request.session ||!request.session.login_name) {
        response.status(401).send();
        return;
    }

    var photo_id = request.params.photo_id;
    Photo.findOne({_id: photo_id}, function (err, photo) {
        if (err) {
            response.status(500).send("Like error");
            return;
        }
        if (photo === undefined) {
            response.status(401).send('Invalid photo id');
        }
        var user_id = request.session.user_id;
            var i = photo.likes.indexOf(user_id);
            if(i < 0) {
                photo.likes.push(user_id);
            } else {
                photo.likes.splice(i,1);
            }
        photo.save();
        response.status(200).send();
    });
});
app.post('/favorites/:photo_id', function (request, response) {
    if (!request.session ||!request.session.login_name) {
        response.status(401).send();
        return;
    }
    var photo_id = request.params.photo_id;
    var photo = request.body.photo;
    User.findOne({_id:request.session.user_id}, function (err,user) {
        if (err) {
            console.error('Finding user error', err);
            response.status(400).send(JSON.stringify(err));
            return;
        }
        for(var i = 0; i < user.favorite_photos.length; i++) {
            var favphoto = user.favorite_photos[i];
            if(favphoto._id === request.body.photo._id) {
                response.end('Photo already in favorite.');
                return;
            }
        }
        user.favorite_photos.push({
                _id: photo._id,
                date_time:photo.date_time,
                user_id:photo.user_id,
                file_name: photo.file_name
            });
        user.save();
        response.status(200).send();
    });
});

//delete photos from favorite list
app.post('/deleteFavorite/:photo_id', function (request, response) {
    if (!request.session ||!request.session.login_name) {
        response.status(401).send();
        return;
    }
    var photo_id = request.params.photo_id;
    User.findOne({_id:request.session.user_id}, function (err,user) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        for (var i=0; i < user.favorite_photos.length; i++) {
            var temp_fav = user.favorite_photos[i];
            if (String(temp_fav._id) === String(photo_id)) {
                temp_fav.remove();
            }
        }
        user.save();
        response.status(200).send(JSON.stringify(user));
        return;
    });    
});


// delete user's comment
app.post('/deleteComment/:photo_id', function (request, response) {
    if (!request.session || !request.session.login_name) {
        response.status(401).send();
        return;
    }
    if (request.body.comment.length === 0) {
        response.status(400).send();
        return;
    }
    var photo_id = request.params.photo_id;
    Photo.findOne({_id: photo_id}, function(err, photo) {
        if (err) {
            response.status(500).send(JSON.stringify(err));
            return;
        }
        if (!photo || photo.length === 0) {
            response.status(400).send('no photos' + photo_id);
            return;
        }
        for (var i = 0; i < photo.comments.length; i++) {
            var comment = photo.comments[i];
            if (String(comment.user_id) === String(request.session.user_id)) {
                comment.remove();
            }
        }
        photo.save();
        response.status(200).send();
    });
});


// deleting user's photo
app.post('/deletePhoto/:photo_id', function (request, response) {
    if (!request.session || !request.session.login_name) {
        response.status(401).send();
        return;
    }
    var photo_id = request.params.photo_id;
    Photo.findOne({_id: photo_id}, function(err, photo) {
        if (err) {
            response.status(500).send(JSON.stringify(err));
            return;
        }
        if (!photo || photo.length === 0) {
            response.status(400).send('no photos' + photo_id);
            return;
        }
        if (String(photo.user_id) === String(request.session.user_id)) {
            Photo.remove({_id: photo_id}, function(err) {
                if(err){
                    response.status(401).send("An Error Occurred");
                    return;
                }
                response.status(200).send();
            });
        } else {
            response.status(401).send('Permission Denied.');
        }
    });
});

// delete users
app.post("/deleteUser/:id", function(request, response) {
    console.log('de user api');
    if (!request.session || !request.session.login_name) {
        response.status(401).send();
        return;
    }
    var user_id = request.params.id;

    Photo.find({user_id: user_id}, function (err, photos) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
          }
        for (var i = 0; i < photos.length; i++) {
            delete photos[i];
        }

        User.find({}, function (err, user) {
            if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
            }
            for (var u = 0; u < user.length; u++) {
                var tempUser = user[u];
                for (var j = 0; j < tempUser.favorite_photos.length; j++) {
                    if (String(tempUser.favorite_photos[j].user_id) === String(user_id)){
                        tempUser.remove();
                    }
                }
            }

            Photo.find({}, function (err, photo) {
                if (err) {
                response.status(400).send(JSON.stringify(err));
                return;
                } 
                for (var k = 0; k < photo.length; k++) {
                    for (var l = 0; l < photo[k].likes.length; l++) {
                            if(String(photo[k].likes[l]) === String(user_id)){
                                photo[k].remove();
                            }
                        }
                    }

                User.findOne({_id: user_id}, function(err,user) {
                    if (err) {
                    response.status(400).send(JSON.stringify(err));
                    return;
                    }
                    if(!user){
                    response.status(400).send('no users' + user_id);
                    return;   
                    }
                    user.remove();
                    response.status(200).send();
                });
            });
        });
    });        
});


app.post('/user', function (request, response) {
    var login_name = request.body.login_name;
    var password = request.body.password;
    var first_name = request.body.first_name;
    var last_name = request.body.last_name;
    var location = request.body.location;
    var description = request.body.description;
    var occupation = request.body.occupation;
    if (!login_name || login_name === "") {
        response.status(400).send("Must specify login name!");
        return;
    }
    User.findOne({login_name: login_name}, function(err, user) {
        if (err) {
            response.status(400).send(JSON.stringify(err));
            return;
        }
        if (user) {
                response.status(400).send('Login Name ' + login_name + ' is already taken');
                return;
        }
        var params = request.body;
        var cryptoPassword = cs142password.makePasswordEntry(params.password);
        params.password_digest = cryptoPassword.hash;
        params.salt = cryptoPassword.salt;
        User.create({login_name:login_name, password_digest:cryptoPassword.hash, salt: cryptoPassword.salt, first_name:first_name,last_name:last_name, location:location, description:description, occupation: occupation}, function() {
                if (err) {
                        response.status(400).send(JSON.stringify(err));
                        return;
                    } 
                    response.status(200).send();
        });
    });
});


var server = app.listen(3000, function () {
    var port = server.address().port;
    console.log('Listening at http://localhost:' + port + ' exporting the directory ' + __dirname);
});



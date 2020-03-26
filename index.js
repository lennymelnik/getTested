var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var http = require('http');
var https = require('https');
var nodeRequest = require('request')
var bcrypt = require('bcrypt');
var expressLayouts = require('express-ejs-layouts')
var uniqid = require('uniqid')




var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = "mongodb://symple.city:27017/mydb";
//mongodb://216.250.126.175:27017,216.250.126.175:27018/mydb?replicaSet=rs0



MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("getTested");

    var app = express();
    var httpServer = http.createServer(app);
    //var httpsServer = https.createServer(credentials, app);
    var io = require('socket.io')(httpServer);
    app.listen(80);
    //httpsServer.listen(443);


    app.use(session({
        secret: 'e022516b41f20607ff76f00c7f594692',
        resave: true,
        saveUninitialized: true
    }));

    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    app.set('layout', 'mainPageLayout','chatLayout','authLayout');

    app.use(expressLayouts);

    app.use(bodyParser.urlencoded({
        extended: true
    }));

    app.use(bodyParser.json());

    //Add css
    app.use(express.static('assets'))


    //Send users to main page
    app.get('/login', function(request, response) {
        response.sendFile(path.join(__dirname + '/login.html'));


    });
    app.get('/register', function(request, response) {
        response.sendFile(path.join(__dirname + '/register.html'));
    });
    

    //List all of the chats in order of last modified (timestamp)
    app.get('/chat', function(request, response) {
        
        if (request.session.loggedin == true) {
            if (request.query.u == null){
            //Which account type to list

            var query = {
                email: request.session.email
            }
            
            dbo.collection("accounts").find(query).toArray(function(err, result) {

                    if (err) throw err;
                    var refreshUser = result[0]
        
                    var chatQuery = {
                        _id : result[0].chats
                    }
                    
               
                    dbo.collection("chats").find(chatQuery, function(err, res) {
                    if (err) throw err;
                    console.log("1 document inserted");
                    response.render('messenger/index', {layout : "chatLayout", chats : result, user : refreshUser, otherUsername : request.query.u});
                });
            });
            } else {
                //Find a specific chat

                var query = {
                    email: request.session.email
                }
                
                dbo.collection("accounts").find(query).toArray(function(err, result) {
    
                        if (err) throw err;
                    
                        var refreshUser = result[0]
            //ADD CHANGE HERE

            if(refreshUser.accountType == 0){
                var chatQuery = {
                    influencerUsername : refreshUser.username,
                    buisnessUsername : request.query.u
                }
            } else{
              var chatQuery = {
                  influencerUsername : request.query.u,
                  buisnessUsername : refreshUser.username
              }
            }
                         console.log("finding chat")
                        console.log(chatQuery)
                        dbo.collection("chats").find(chatQuery).toArray(function(err, res) {
                        if (err) throw err;
                        console.log(res);
                        response.render('messenger/chat', {layout : "chatLayout", chat : res[0] , user : refreshUser, otherUsername : request.query.u});
                    });
                });

            }



        } else {
            request.session.returnTo = request.originalUrl;
            response.redirect('/login')
            response.end();
        }
        

    });


    
    //Creating Accounts 

    app.post('/create', function(request, response) {

        bcrypt.hash(request.body.password, saltRounds, function (err,   hash) {
        var userObj = {
            username: request.body.username,
            email: request.body.email,
            password: hash,
            accountType: parseInt(request.body.accountType),
            fullName: request.body.fullname,
            timestamp : Date.now(),
            hashtags : [null, null, null],
            userId : uniqid()
        }
    
        var emailExists = {
            email: request.body.email
        }
        var usernameExists = {
            username: request.body.username
        }
        dbo.collection("accounts").find(emailExists).toArray(function(err, result) {
            console.log("got here")
            if (result.length > 0){
                response.send('That email is in use, please use a different one')
            }
            else{
            dbo.collection("accounts").find(usernameExists).toArray(function(err, result) {
                if (result.length > 0){
                    dbo.collection("accounts").insertOne(userObj, function(err, res) {
                        if (err) throw err;
                        console.log("Account Created")
                    });
                    var query = {
                        email: request.body.email
                    }
                    dbo.collection("accounts").find(query).toArray(function(err, result) {
                        request.session.loggedin = true;
                        request.session.email = request.body.email;
                        request.session.user = result[0];
                        request.session.accountType = parseInt(request.body.accountType)
                        response.redirect('/');
                    });
                }
                else{

                    dbo.collection("accounts").insertOne(userObj, function(err, res) {
                        if (err) throw err;
            
                    });
                    var query = {
                        email: request.body.email
                    }
                    dbo.collection("accounts").find(query).toArray(function(err, result) {
                        request.session.loggedin = true;
                        request.session.email = request.body.email;
                        request.session.user = result[0];
               
                        request.session.accountType = parseInt(request.body.accountType)
                        response.redirect('/main');
                    });
                }

            
            });
            }
        });
        

    });
        
    })


    //Authenticate
    app.post('/auth', function(request, response) {

        var email1 = request.body.email;
        bcrypt.hash(request.body.password, saltRounds, function (err,   hash) {

        var query = {
            email: email1
        }
        if (email1) {
            dbo.collection("accounts").find(query).toArray(function(err, result) {
                if (err) throw err;
                console.log(result[0]['password'])
                var account = result[0]['accountType']
                console.log(account)
                console.log(hash)
                if (result[0]) {

                    bcrypt.compare(request.body.password, result[0]['password'], function (err, result) {
                      
                        if (result == true) {
                            if (request.session.returnTo) {
                                console.log("logged in")

                                request.session.loggedin = true;
                                request.session.email = email1;
                                request.session.user = result;
					            request.session.accountType = parseInt(account)
                                response.redirect(request.session.returnTo);
                                response.end();
                            } else {
                              
                                request.session.loggedin = true;
                                request.session.email = email1;
                                request.session.user = result;
					            request.session.accountType = parseInt(account)
                             
                                response.redirect('/');
                                response.end();
                            }
                        } else {
                      
                         response.redirect('/login');
                        }
                      });
                } else {
                    response.send('This account does not exist');

                }
            });
        } else {
            response.send('Please enter Username and Password!');
            response.end();
        }
    });
    });


    app.get('/login', function(request, response) {
        var tryAgain = request.query.result;
        response.render('login');
    })


    //Main Page once logged in
    app.get('/main', function(request, response) {
     
        if (request.session.loggedin == true) {
            if (request.session.accountType == 1) {


                //Which account type to list


                var toFind = 0
                var accountName = "Influencer"

                var query = {
                    accountType: toFind
                }

                console.log(query)
                dbo.collection("accounts").find(query).toArray(function(err, result) {
                    if (err) throw err;
                    var all = result;
                    console.log(result);

                    response.render('accounts', {
                        user: request.session.user,
                        allOp: all,
                        accountName: accountName
                    });
                });

            } else {
                response.send('Sorry you cannot access this page')
            }
        } else {
            request.session.returnTo = request.originalUrl;
            response.redirect('/login')
        }
    });




    app.get('/account', function(request, response) {

        if (request.session.loggedin == true) {
            //Which account type to list



            var query = {
                email: request.session.email
            }
            console.log(query)
            dbo.collection("accounts").find(query).toArray(function(err, result) {
                if (err) throw err;
                var refreshUser = result;
                console.log("Hash")
                console.log(refreshUser.hashTags)
                console.log(refreshUser[0])
                response.render('account', {
                    user: refreshUser[0], hashtags : refreshUser[0].hashTags
                });
            });



        } else {
            request.session.returnTo = request.originalUrl;
            response.redirect('/login')
        }
    });

    //Main Page
    app.get('/', function(request, response) {
		
		if (request.session.loggedin == true) {
            //Which account type to list

            var query = {
                email: request.session.email
            }
           
			dbo.collection("accounts").find(query).toArray(function(err, result) {
                if (err) throw err;
                var refreshUser = result;
                console.log("refreshUser")
                console.log(refreshUser)
                response.render('home', {
                    user: refreshUser[0]
                });
            });

        } else {
           
            response.sendFile(path.join(__dirname + '/main.html'));
        }
    });

    app.get('/us', function(request, response) {
		
		if (request.session.loggedin == true) {
            //Which account type to list

            var query = {
                email: request.session.email
            }
           
			dbo.collection("accounts").find(query).toArray(function(err, result) {
                if (err) throw err;
                var refreshUser = result;
                console.log("refreshUser")
                console.log(refreshUser)
                response.render('us', {
                    user: refreshUser[0]
                });
            });

        } else {
           
            response.render('us', {user: null});
        }
    });
    //Logout

    app.get('/logout', function(req, res) {
		req.session.loggedin = null;
		req.session.user = null;
		req.session.email = null;
        req.session.accountType = null;
        req.session.id = null;
        res.redirect('/');
    });

    //Load that users page
    app.get('/u/?', function(request, response) {


        var authCode = request.query.profile;

        if (request.session.loggedin == true & request.session.accountType == 1) {
            var query = {
                username: authCode
            }
           
			dbo.collection("accounts").find(query).toArray(function(err, result) {
                if (err) throw err;
                var refreshUser = result[0];
                delete refreshUser.password;
                request.session.profile = refreshUser;
                response.render('profile', {
                    profile: refreshUser, user : request.session.user
                });
            });



        } else {
            request.session.returnTo = request.originalUrl;
            response.redirect('/login')

        }



    });

    app.post('/updateAccount', function(request, response) {

        var newBio = request.body.bio;
        var firstName = request.body.firstName;
        var lastName = request.body.lastName;
        var city = request.body.city;
        var address = request.body.address;
        var phone = request.body.phone;
        var email = request.body.email;
        var hashtags = request.body.hashtags;


        var newvalues = {
            $set: {
                bio: newBio,
                firstName : firstName,
                lastName : lastName,
                city : city,
                address : address,
                phone : phone,
                email : email,
                hashtags : hashtags

            }
        };
        if (request.session.loggedin == true) {


            var query = {
                email: request.session.email
            }

            dbo.collection("accounts").updateOne(query, newvalues, function(err, result) {
                if (err) throw err;


                response.redirect('/account')
                response.end();


            });
        }
    });


    var last =  function(array, n) {
        if (array == null) 
          return void 0;
        if (n == null) 
           return array[array.length - 1];
        return array.slice(Math.max(array.length - n, 0));  
        };


    io.on('connection', function (socket) {

       

        console.log("commected to socket")
        socket.on('requestChat', function (data) {
            console.log("requesting data")



             //Look for any changes
           
    

             if(data.accountType == 0){
                var query = {
                    influencerUsername : data.username,
                    buisnessUsername : data.otherUser
                }
            } else{
              var query = {
                  influencerUsername : data.otherUser,
                  buisnessUsername : data.username
              }
            }
          dbo.collection("chats").find(query).toArray(function(err, resu) {
              

            var local = resu
          // Define change stream
          console.log("starting check stream")
          var changeStream = dbo.collection("chats").watch(query);
          // start listen to changes
          changeStream.on("change", function(event) {
              console.log("There has been a change")
              if(data.accountType == 0){
                var query = {
                    influencerUsername : data.username,
                    buisnessUsername : data.otherUser
                }
            } else{
              var query = {
                  influencerUsername : data.otherUser,
                  buisnessUsername : data.username
              }
            }
            dbo.collection("chats").find(query).toArray(function(err, resul) {
                if (err) throw err;

            
                console.log("Chat must be updated, here is the new array")
                console.log(resul)

                //If the chat has changed
                //Compare the length, send the added ones
                var localMessages = local[0].messages
                var cloudMessages = resul[0].messages
                var newLength = cloudMessages.length
                var oldLength = localMessages.length
                var newMessages = last(cloudMessages,newLength - oldLength);
                //change sentFrom to say wether it is the user r not
                socket.emit('newMessage', { newChats: newMessages} );
                local = resul;
                    

          });
        });
        });
            

        })
  

        //If our user submits a message
        socket.on('send', function (data) {

            console.log("Sending Message");
            if(data.accountType == 0){
                var query = {
                    influencerUsername : data.username,
                    buisnessUsername : data.otherUser
                }
            } else {

                var query = {
                    influencerUsername : data.otherUser,
                    buisnessUsername : data.username
                }
            }
            console.log(query)
            var newvalues = {
                $push: {
                    messages : {sentFrom : data.userId, content : data.content, timestamp : Date.now() 
    
                }
    
                }
            };
            dbo.collection("chats").updateOne(query, newvalues, function(err, result) {
                if (err) throw err;
                console.log("message sent")
            });
  

          });
      });


});
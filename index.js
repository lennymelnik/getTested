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
const saltRounds = 10;



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
    httpServer.listen(80);
    //httpsServer.listen(443);


    app.use(session({
        secret: 'e022516b41f20607ff76f00c7f594692',
        resave: true,
        saveUninitialized: true
    }));

    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');
    app.set('layout', 'mainPageLayout','chatLayout','authLayout','noLayout','clinicLayout');

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
    app.get('/registerClinic', function(request, response) {
        response.sendFile(path.join(__dirname + '/registerClinic.html'));
    });
    app.get('/admin', function(request, response) {
     

            if (request.session.loggedin == true && request.session.accountType == 1) {
                //Which account type to list
    
                var query = {
                    email: request.session.email
                }
               
                dbo.collection("accounts").find(query).toArray(function(err, result) {
                    if (err) throw err;
                    var refreshUser = result;
                    console.log("refreshUser")
                    console.log(refreshUser)
                    response.render('admin', {layout : "clinicLayout",
                        user: refreshUser[0]
                    });
                });
    
            } else {
               
                response.sendFile(path.join(__dirname + '/main.html'));
            }
    });
    app.get('/myAppointments', function(request, response) {
     

        if (request.session.loggedin == true && request.session.accountType == 0) {
            //Which account type to list

            var query = {
                email: request.session.email
            }
           
            dbo.collection("accounts").find(query).toArray(function(err, result) {
                if (err) throw err;
                var refreshUser = result;
                console.log("refreshUser")
                console.log(refreshUser)
                response.render('myAppointments', {
                    user: refreshUser[0]
                });
            });

        } else {
           
            response.sendFile(path.join(__dirname + '/main.html'));
        }
});
app.get('/bookAppointment', function(request, response) {
     

    if (request.session.loggedin == true && request.session.accountType == 0) {
        //Which account type to list

        var query = {
            email: request.session.email
        }
        var query2 = {
            accountType : 1
        }
       
        dbo.collection("accounts").find(query).toArray(function(err, result) {
            if (err) throw err;
            var refreshUser = result;
            console.log("refreshUser")
            console.log(refreshUser)
            dbo.collection("accounts").find(query2).toArray(function(err, result2) {
                if (err) throw err;
                var all = result2;
                console.log(result2);
                response.render('bookAppointments', {
                    user: refreshUser[0],
                    clinics : all
                });
                
            });
            
        });

    } else {
       
        response.sendFile(path.join(__dirname + '/main.html'));
    }
});
app.get('/patients', function(request, response) {
     
    if (request.session.loggedin == true) {
        if (request.session.accountType == 1) {


            //Which account type to list


            var query = {
                email: request.session.email
            }
           
            dbo.collection("accounts").find(query).toArray(function(err, result) {
                if (err) throw err;
                var refreshUser = result;
                console.log("refreshUser")
                console.log(refreshUser)
                response.render('patients', {layout : "clinicLayout",
                    user: refreshUser[0]
                });
            });

        } else {
            response.send('Sorry you cannot access this page')
        }
    } else {
        request.session.returnTo = request.originalUrl;
        response.redirect('/')
    }
});
app.get('/appointments', function(request, response) {
     
    if (request.session.loggedin == true) {
        if (request.session.accountType == 1) {


            //Which account type to list


            var query = {
                email: request.session.email
            }
           
            dbo.collection("accounts").find(query).toArray(function(err, result) {
                if (err) throw err;
                var refreshUser = result;
                console.log("refreshUser")
                console.log(refreshUser)
                response.render('appointments', {layout : "clinicLayout",
                    user: refreshUser[0]
                });
            });

        } else {
            response.send('Sorry you cannot access this page')
        }
    } else {
        request.session.returnTo = request.originalUrl;
        response.redirect('/')
    }
});
    app.get('/testingStations', function(request, response) {
     
        if (request.session.loggedin == true) {
            if (request.session.accountType == 1) {


                //Which account type to list


                var query = {
                    email: request.session.email
                }
               
                dbo.collection("accounts").find(query).toArray(function(err, result) {
                    if (err) throw err;
                    var refreshUser = result;
                    console.log("refreshUser")
                    console.log(refreshUser)
                    response.render('testingStations', {layout : "clinicLayout",
                        user: refreshUser[0]
                    });
                });

            } else {
                response.send('Sorry you cannot access this page')
            }
        } else {
            request.session.returnTo = request.originalUrl;
            response.redirect('/')
        }
    });
    app.post('/addTesting', function(request, response) {

        var name = request.body.testingName;
        var timeOpen = request.body.timeOpen;
        var timeClose = request.body.timeClose;
        var appointmentLength = request.body.appointmentLength;

        var value1 = parseInt(timeOpen.slice(0, 2))*60 + parseInt(timeOpen.slice(3, 5))
        var value2 = parseInt(timeClose.slice(0, 2))*60 + parseInt(timeClose.slice(3, 5))
        //Get all days
        var days = []
        var today = new Date();
        var someDate = new Date();
        someDate.setDate(someDate.getDate() + 20); 
        var appointments = []
      

        var Difference_In_Time =  someDate.getTime()- today.getTime(); 
        var Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24); 
        var appointmentCount = ((value2 - value1)/appointmentLength)

        for(i = 0; i < Math.floor(appointmentCount); i++){
            appointments.push({time : value1,
            patient : null})
            value1 = parseInt(value1) + parseInt(appointmentLength)
           

        }
       
  

        while(Difference_In_Days > 0){
            days.push({date : today.getTime(),
                times : appointments
            })
            today.setDate(today.getDate() + 1)
            console.log(today)
            Difference_In_Days = Difference_In_Days - 1
        }
        console.log(appointments.length)
       

        var stationObject = {
            $push: { testingStation : {
                name: name,
                timeOpen : timeOpen,
                timeClose : timeClose,
                appointmentLength : appointmentLength,
                appointments : days
            }
            }
        };
        if (request.session.loggedin == true) {


            var query = {
                email: request.session.email
            }

            dbo.collection("accounts").update(query, stationObject, function(err, result) {
                if (err) throw err;


                response.redirect('/testingStations')
                response.end();


            });
        }
    });

    app.get('/clinic?', function(request, response) {


        var authCode = request.query.facilityCode;

        if(authCode != undefined){

        if (request.session.loggedin == true & request.session.accountType == 0) {
            var query = {
                facilityCode: authCode
            }
           
			dbo.collection("accounts").find(query).toArray(function(err, result) {
                if (err) throw err;
                var refreshUser = result[0];
                delete refreshUser.password;
                app.locals.profile = refreshUser;
                
                var query = {
                    email: request.session.email
                }
               
                dbo.collection("accounts").find(query).toArray(function(err, result) {
                    if (err) throw err;
                    var refreshUser1 = result[0];
                    
                    response.render('facilityProfile',{
                        profile: refreshUser, user : refreshUser1
                    });
                });
                
            });



        } else {
            request.session.returnTo = request.originalUrl;
            response.redirect('/login')

        }
    }
    else{
     
            response.redirect('/')
    }
    



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

            if(parseInt(request.body.accountType) == 0){
        var userObj = {
            email: request.body.email,
            password: hash,
            accountType: parseInt(request.body.accountType),
            firstName: request.body.firstname,
            lastName: request.body.lastname,
            phone: request.body.phone,
            timestamp : Date.now(),
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
    }
    else if(parseInt(request.body.accountType) == 1){
        var userObj = {
            email: request.body.email,
            phone: request.body.phone,
            password: hash,
            accountType: parseInt(request.body.accountType),
            clinicName: request.body.name,
            location : {address: request.body.address,
                address2: request.body.address2,
                state: request.body.state,
                city: request.body.city,
            zip : request.body.zip},
            facilityCode : request.body.code,
            timestamp : Date.now(),
            userId : uniqid(),
            testingStation : []
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

    }

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
                console.log("Found Account")
                var account = result[0]['accountType']
            
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
                         response.send('This account does not exist');
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
        socket.on('requestAppointments', function (data) {
             
            
            dbo.collection("accounts").find({userId : data.userId}).toArray(function(err, result) {
                if (err) throw err;
                var refreshUser = result[0];
                delete refreshUser.password;
                socket.emit('appointments', { clinicProfile : refreshUser.testingStation} );
               
            });
               
               
                    

          });
          socket.on('reserve', function (data) {

            var final = "testingStation." + data.station + ".appointments." + data.day + ".times." + data.time + ".patient"
            var query = {
                userId : data.clinicId
            }
            var appointment = {
                $set: {
                    [final] : data.userId
                    
    
                }
            };
            dbo.collection("accounts").updateOne(query, appointment, function(err, result) {
                if (err) throw err;


            });
        

          });

          socket.on('requestPatients', function (data) {
             
            
            dbo.collection("accounts").find({userId : data.userId}).toArray(function(err, result) {
                if (err) throw err;
                var refreshUser = result[0];
                delete refreshUser.password;
                socket.emit('patients', { clinicProfile : refreshUser.testingStation} );
               
            });
               
               
                    

          });
     
            

        })
  


});
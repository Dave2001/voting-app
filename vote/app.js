var express = require('express');
var session = require('express-session');
var bodyParser=require('body-parser');
var mongoose=require('mongoose');
var pug = require('pug');
var bcrypt = require('bcryptjs');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

// connect to mongo db
mongoose.connect('mongodb://localhost/vote');  // connect to the db

var UserSchema = new mongoose.Schema({
  id: ObjectId,
  firstName: String,
  lastName: String,
  email: { type: String, unique: true},
  password: String
});

var User = mongoose.model('User', UserSchema);

var PollSchema = new mongoose.Schema({
  id: ObjectId,
  question: String,
  owner: String,
  options: [ { 
    id: ObjectId, 
    text: String, 
    count: {type: Number, default: 0} 
  } ],
});

var Polls = mongoose.model('Polls', PollSchema);

var VotesSchema = new mongoose.Schema({
  id: ObjectId,
  voter: { type: ObjectId, ref: 'User' },
  poll: { type: ObjectId, ref: 'Poll' },
  choice: { type: ObjectId, ref: 'Poll'.options}
});

var Votes = mongoose.model('Votes', VotesSchema);


var app = express();

app.set('view engine', 'pug');  // use pug as the engine

app.locals.pretty = true;  // dont minify the html source code

app.use('/static',express.static('public'));

//  run the req through this middleware to make it available via req.body 
app.use(bodyParser.urlencoded({extended: true}));

//  prep the session middleware
app.use(session({
    name: 'session',
    secret  : '4j8sdf9832jojfdd8uf84jf21re',
    resave : false,
    saveUninitialized : false
}));

// this middleware will run before the other routes are processed,  it makes the user available on every page
app.use(function(req,res,next) {
    if ( req.session && req.session.user) {  // is there session and a user set in the session
        User.findOne({email: req.session.user.email }, function(err,user){ // check the db for the user
            if(user && !err) { // if we found the user and there is no error
              req.user = user;  // set the variable for use in our html page
              delete req.user.password; // remove password from the req so it cant be exposed
              req.session.user = user;  // refresh the session
              res.locals.user = user;  // make user avaiable as a variable in a view
                          
            }
            next();  // continue processing the app function that was orginally called
        });
    } else  { 
        next();  //no session/user was set so just continue processing the app function that was orginally called
    }
});    
    
// this function makes sure the user is logged on, since its a regular function, it only runs for routes that specifically call it 
function  requireLogin (req,res,next) {
    if(!req.user) {  // if we dont have a user
        res.redirect('/login');  // send them to the login page
    } else {
        next();  // continue processing the app function
    }
}
    

// ------------------------------
//  Render the home page.
// ------------------------------
app.get('/', function(req, res) {
  res.redirect('/polls');
});

// ------------------------------
//  Render the dashboard page.
// ------------------------------
app.get('/dashboard', requireLogin , function(req, res) {  // requireLogin will redirect them if they are not logged in
  res.render('dashboard.pug');
});


// ------------------------------
//  Render the registration page.
// ------------------------------
app.get('/register', function(req, res) {
  res.render('register.pug');
});

// ------------------------------
// handle post from the registration form
// ------------------------------
app.post('/register', function(req, res) {
    var hash = bcrypt.hashSync(req.body.password,bcrypt.genSaltSync(10)); // has the password
    var user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hash
    });
    // save the posted data
    user.save(function(err) {
        if (err) {
          var error = 'Something bad happened! Please try again.';
          if (err.code === 11000) {  // non-unique will return 11000
            error = 'That email is already taken, please try another.';
          }
          res.render('register.pug', { error: error });
        } else {
            res.redirect('/polls');
        }
    });
});


// ------------------------------
//  Render the login page.
// ------------------------------
app.get('/login', function(req, res) {
  res.render('login.pug');
});

// ------------------------------
//  handle the post from the login page.
// ------------------------------
app.post('/login', function(req, res) {
  User.findOne({ email: req.body.email }, function(err, user) {  // find the user in the db
    if (!user || err) {
      res.render('login.pug', { error: "Incorrect email / password."});
    } else {
      if (bcrypt.compareSync(req.body.password,user.password)) {  // if passwords match
        req.session.user = user; //set the users cookie
        res.redirect('/polls');
      } else {
        res.render('login.pug', { error: "Incorrect email / password."});
      }
    }
  });
});

// ------------------------------
//  Handle the logout feature.
// ------------------------------
app.get('/logout', function(req, res) {
  if (req.session) {
    req.session.destroy();
  }
  res.redirect('/');
});


// ------------------------------
//  Render the polls page.
// ------------------------------
app.get('/polls', function(req, res) {
  //get current polls
  Polls.find({}, function(err, doc) {  // find all polls in the db
    if (!doc || err) {
      // no polls found
      res.redirect('/polls');
    } else {
      // found polls
      //res.locals.polls = poll;  // set the results in the response
      res.render('polls.pug',{ questions: doc});
    }  
  });
});

// ------------------------------
//  handle the post from polls page.
// ------------------------------
app.post('/polls', function(req, res) {
  //see if they want to create
  if (req.body.qid=="New"){
    res.redirect('/create');
  }
  
  //get the question from the db so we can display it
  Polls.findOne({_id:req.body.qid}, function(err, polldoc) {  // find this poll
    if (!polldoc || err) {
      // no polls found
    } else {
      // found poll
      if ( req.user) {//user is logged in
        //see if this user already took this poll
        Votes.findOne({voter:req.user._id, poll:req.body.qid}, function(err, votedoc) { // did they already vote
          if(err){
            throw err;
          } else {
              //console.log("polldoc=" + polldoc);
              //console.log("votedoc=" + votedoc);
              res.render('polldetail.pug',{ poll: polldoc, votes: votedoc});
          }
        });
      } else {      
          // no user logged in, just give the results
          res.render('polldetail.pug',{ poll: polldoc});
      }  
    }  
  });
});  

// ------------------------------
//  handle post to /vote page
// ------------------------------
app.post('/vote',requireLogin, function(req, res) {
  //make sure they havent voted already
  //see if this user already took this poll
  Votes.findOne({voter:req.user._id, poll:req.body.qid}, function(err, votedoc) { // did they already vote
    if(err){
      throw err;
    } else {
        if(votedoc){
          //they already voted
          res.redirect('/polls');
          return;
        } 

        var newvote = new Votes({
                voter: req.user._id,
                poll: req.body.qid,
                choice: req.body.choice
              });
          //save the users choice
          newvote.save(function(err,doc) {
            if(err){
              throw err;
            } else {
              //increment the vote count
              Polls.findOneAndUpdate({ _id:req.body.qid, 'options._id':req.body.choice  },{ $inc:{ 'options.$.count' : 1 }},{new:true}, function(err, polldoc) {
                          console.log("polldoc=" + polldoc);
                if (err) { 
                  throw err;
                } else {
                    Votes.findOne({voter:req.user._id, poll:polldoc._id}, function(err, votedoc) { // did they already vote
                      if(err){
                        throw err;
                      } else {
                          //console.log("polldoc=" + polldoc);
                          //console.log("votedoc=" + votedoc);
                          res.render('polldetail.pug',{ poll: polldoc, votes: votedoc});
                      }
                    });
                }
              });
            }
          });
      }
  });
});


// ------------------------------
//  handle the create poll page
// ------------------------------
app.get('/create',requireLogin, function(req, res) {
  res.render('createpoll.pug'); 
});


// ------------------------------
//  handle post from the create poll page
// ------------------------------
app.post('/create',requireLogin, function(req, res) {
  if(req.session && req.body.question){  // they are logged in and they submitted a question
    console.log("a new question has been submitted");
    //insert the question into the db
    var ch=[];
    for(var i=0;i<req.body.choice.length;i++){
      if (req.body.choice[i].length>0){
        //add it
        ch.push({text:req.body.choice[i]}); 
      }
    }
    var newpoll = new Polls({
          question: req.body.question,
          options: ch,
          owner: req.user._id
        });
    //save the users choice
    newpoll.save(function(err,doc) {
      if (err) { 
        throw err;
      } else {
        res.redirect('/polls');
      }
    });


  } else {
      // no question was submitted, send them back
      res.redirect('/create');
      return;
  } 
});


// ------------------------------
//  handle post to delete a poll
// ------------------------------
app.get('/delete',requireLogin, function(req, res) {
  console.log(req.query.poll + " " + req.user._id);
  //make sure they are the owner 
  Polls.findOne({_id:req.query.poll, owner:req.user._id}, function(err, polldoc) {
    console.log("pollfound " + polldoc);
    if (polldoc){
      //they are the owner
      if(req.user && req.query.poll){  // they are logged in and they submitted a question
         // delete poll from db
        console.log("need to delete " + req.query.poll);
        Polls.remove({ _id: req.query.poll, owner:req.user._id }, function(err) {
          if(err) throw err;
        });
       //delete votes from db
        Votes.remove({ poll: req.query.poll }, function(err) {
          if(err) throw err;
        }); 
        res.redirect('/polls');
      }
    } else{
      // they are not the owner
      res.redirect('/polls');
    }
  
  });
});



// ------------------------------
//  listen for requests
// ------------------------------
app.listen(8080, function () {
        console.log('Listening on port 8080...');
});
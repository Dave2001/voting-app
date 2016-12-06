var express = require('express');
var session = require('express-session');
var bodyParser=require('body-parser');
var mongoose=require('mongoose');
var pug = require('pug');
var bcrypt = require('bcryptjs');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

// connect to mongo db
mongoose.connect('mongodb://localhost/auth');  // connect to the db

var User = mongoose.model('User', new Schema({
  id: ObjectId,
  firstName: String,
  lastName: String,
  email: { type: String, unique: true},
  password: String
}));

var Poll = mongoose.model('Poll', new Schema({
  id: ObjectId,
  question: String
}));

var Polloptions = mongoose.model('Polloptions', new Schema({
  id: ObjectId,
  pollid: String,
  option: String
}));

var Choices = mongoose.model('Choices', new Schema({
  id: ObjectId,
  option: String
}));

//var Pollresults = mongoose.model('Pollresults', new Schema({
var PollSchema = new mongoose.Schema({
  id: ObjectId,
  pollid: String,
  userid: String,
  option: String
});

PollSchema.index({ pollid: 1, userid: 1}, { unique: true });

var Pollresults = mongoose.model('Pollresult', PollSchema);

module.exports = Pollresults;

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
  res.render('index.pug');
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
  Poll.find({}, function(err, poll) {  // find all polls in the db
    if (!poll || err) {
      // no polls found
      res.render('polls.pug',{ questions: poll});
    } else {
      // found polls
      //res.locals.polls = poll;  // set the results in the response
      res.render('polls.pug',{ questions: poll});
    }  
  });
});

// ------------------------------
//  handle the post from polls page.
// ------------------------------
app.post('/polls', function(req, res) {
  console.log("qid=" + req.body.qid);
  //console.log("userid=" + req.session.user._id);
  console.log("option=" + req.body.choice);
  
  // if they just submitted their vote on this poll, we need to process the vote
  if(req.session && req.session.user && req.body.choice && req.body.qid){  // they are logged in and they answered a poll
    console.log("a choice has been submitted");
    // update the db with their choice
    var pollresults = new Pollresults({
      pollid: req.body.qid,
      userid: req.session.user._id,
      option: req.body.choice
    });
    //save the users choice
    pollresults.save(function(err) {
        if (err) {
          var error = 'Something bad happened! Please try again.';
          if (err.code === 11000) {  // non-unique will return 11000
            error = 'You already voted on this poll.';
          }
          res.send(error);
        } 
    });
    console.log("vote added to database ");
  } 
  
  //if they want to create a new poll, we need to redirect them
  if(req.session && req.body.qid=="New"){
     console.log('redirect to create');
     res.redirect('/create');
     return;
  }
  
  //get the poll from the db so we can display it
  var pollquestion="";
  Poll.find({_id:req.body.qid}, function(err, poll) {
    if(!poll || err) {
      // not found
    } else {
      pollquestion=poll;
    }  
  });
 
  if (req.session && req.session.user){  //if we have session
    console.log("questio id=" + req.body.qid);
    console.log({userid:req.session.user._id, pollid:req.body.qid});

   
    Pollresults.findOne({userid:req.session.user._id, pollid:req.body.qid}, function(err, pollresults) {  // see if this user already took this poll
      if(!pollresults || err) {
            console.log("they havent anwsered this one " + req.session.user._id + " " + req.body.qid);
        // they have not answered it yet so we should give them a chance
        //  query for the poll options 
        Polloptions.find({pollid: req.body.qid}, function(err, polloptions) {  // see if this user already took this poll
           //console.log("option query result= " + polloptions);
           if(!polloptions || err) {
             // no options found
             res.render('polloptions.pug',{quest: pollquestion});
           } else {
             // send the options
             res.render('polloptions.pug',{ options: polloptions, poll: pollquestion});
           }
        });
        

      } else {
        console.log("they already anwsered this one");
        //they have already answered it so display results
        res.render('polldetail.pug',{ results: pollresults});        
        
      } 
    });
  } else {
    //we have no session, just display results
    res.render('polldetail.pug',{ results: pollresults});
  }
  
});


// ------------------------------
//  handle the create poll page
// ------------------------------
app.get('/create',requireLogin, function(req, res) {
  Choices.find({}, function(err, pollchoices) {
    if(!err) {
      res.render('createpoll.pug',{ choices: pollchoices}); 
    }
  });  
});

// ------------------------------
//  handle post from the create poll page
// ------------------------------
app.post('/create',requireLogin, function(req, res) {
  if(req.session && req.body.question){  // they are logged in and they submitted a question
    console.log("a new question has been submitted");
    //insert the question into the db

    var newpoll = new Poll({
          question: req.body.question,
        });
    //save the users choice
    newpoll.save(function(err,doc) {
        if (!err) {
           //save the choices
           // first split the command delimited values
           var ch=req.body.qchoices.split(",");
           for(var i=0;i<ch.length;i++){
             // create the new object
             var newchoice = new Polloptions({
               pollid: doc._id,
               option: ch[i]
              });
              console.log("new choice= " + newchoice);
              //insert it into the db
              newchoice.save(function(err) {
                if (err) throw err;
              });
           }
        }
       res.redirect('/polls');
    });









    
  } else {
      // no question was submitted, send them back
      res.redirect('/create');
      return;
  } 
});


// ------------------------------
//  listen for requests
// ------------------------------
app.listen(8080, function () {
        console.log('Listening on port 8080...');
});
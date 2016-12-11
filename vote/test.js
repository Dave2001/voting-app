// ------------------------------
//  handle the post from polls page.
// ------------------------------
app.post('/polls', function(req, res) {

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

Poll.findOne({}, function(err, poll) {
      console.log("test " + poll);
});
Pollresults.findOne({}, function(err, pollresults) {
      console.log("test2 " + pollresults);
});

    //see of they have answered this one already
    Pollresults.findOne({userid:req.session.user._id, pollid:req.body.qid}, function(err, pollresults) {  // see if this user already took this poll
      console.log(pollresults);
      
      if(!pollresults || err) {
            console.log("they havent anwsered this one " + req.session.user._id + " " + req.body.qid + " " + err);
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
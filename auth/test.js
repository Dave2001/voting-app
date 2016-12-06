var mongoose=require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

mongoose.connect('mongodb://localhost/auth');  // connect to the db

var PollSchema = new mongoose.Schema({
  id: ObjectId,
  pollid: String,
  userid: String,
  option: String
});
// require pollid/userid combo to be unique
PollSchema.index({ pollid: 1, userid: 1}, { unique: true });
var Pollresults = mongoose.model('Pollresults', PollSchema);

console.log('about to query');

Pollresults.findOne({ userid: '583df53e33165c80ab25deeb',pollid: '5847273ead37555c9d90cd21' }, function(err, pollresults) {  
  if(err){
     console.log(err);
  } else {
      if(!pollresults) {
          console.log("no result found " + err);
      } else {
          console.log("results " + pollresults);
      }  
      console.log('end of else');
  }  
  console.log('end of it error');
});
console.log('query should be done');
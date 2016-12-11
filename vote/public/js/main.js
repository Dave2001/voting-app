function choosePoll(qid){
  //set the id for the poll we want    
  document.getElementById('qid').value=qid;
  //submit the form
  document.getElementById('poll-list').submit();  
}

function validate(){
  //get the form
  var form=document.getElementById('create-poll');
  //make sure the question isnt blank
  //get the question field    
  var el=document.getElementById('question');
  if (el.value==""){
    alert("Question can not be left blank!");
    return;
  } 
  //make sure we have atleast 2 choices
  var c=0;
  var choices = document.getElementsByName("choice");
  for(var i = 0; i < choices.length; i++) {  
    if(choices[i].value.length>0){
      c++;
    } else {
      //dont count it
    }  
  }
  if(c<2){
      alert("You must have aleast 2 choices!");
     return;
  }
  //else not problems we cant handle, submit the form
  form.submit();
}

function addchoice(){
 var el=document.getElementById('qchoices');
 var input = document.createElement("input");
 input.type = "text";
 input.name = "choice";
 input.className = "createinput";
 el.appendChild(input);
 el.appendChild(document.createElement("br"));
 el.appendChild(document.createElement("br"));
}

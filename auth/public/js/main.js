function choosePoll(qid){
  //set the id for the poll we want    
  document.getElementById('qid').value=qid;
  //submit the form
  document.getElementById('poll-list').submit();  
}

function validate(){
  //get the form
  var form=document.getElementById('create-poll');
  //get the question field    
  var el=document.getElementById('question');
  if (el.value==""){
    alert("Question can not be left blank!");
  } else {
    form.submit();
  }  
}

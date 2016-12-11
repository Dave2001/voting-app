document.addEventListener("DOMContentLoaded", function() {
  displaychart();
});

function makechart(){
	//build the datapoints
	var dataPoints = [];
    for (var i=0;i<options.length;i++){
        dataPoints.push({
	      label: options[i].text,
	      y: options[i].count
	    }); 
    } 

	var chart = new CanvasJS.Chart("chartContainer", {
		theme: "theme3",//theme1
 	    axisX:{labelFontSize:24},
		animationEnabled: true,   // change to true
		height:250,
		width:400,
		data: [              
		{
		    type: "column",
			dataPoints : dataPoints
			//dataPoints: [
				//{ label: "apple",  y: 10  },
				//{ label: "orange", y: 15  }
			//]
		}
		]
	});
	//add data points
	//chart.options.data[0].dataPoints.push({y: 23});
	//chart.options.data[0].dataPoints.push({y: 13});
	chart.render();
}

function displaychart(){
  //resize div
  //var el=document.getElementById("showbutton");
  //el.style="display:none";
  el=document.getElementById("chartDiv");
  el.style="display:block";
  makechart();
}
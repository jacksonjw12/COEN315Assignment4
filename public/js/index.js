

let data = {'sourceStation':undefined,'destStation':undefined}
let autoUpdatingTransit = false;
let stations = []


let lastMapsPath = {"orig":undefined, "dest":undefined}
let mapsInit = false;
let map;
let directionsService;
let directionsDisplay;
function initMap(center) {
	console.log(center)
	directionsDisplay = new google.maps.DirectionsRenderer;
	directionsService = new google.maps.DirectionsService;
	map = new google.maps.Map(document.getElementById('map'), {
	  zoom: 14,
	  center: center
	});//{lat: 37.77, lng: -122.447}
	directionsDisplay.setMap(map);


	// document.getElementById('mode').addEventListener('change', function() {
	//   calculateAndDisplayRoute(directionsService, directionsDisplay);
	// });
}

function calculateAndDisplayRoute(orig, dest) {
	console.log("test")
	var selectedMode = 'TRANSIT';
	directionsService.route({
	  origin: orig,  // Haight.{lat: 37.77, lng: -122.447}
	  destination: dest,  // Ocean Beach. {lat: 37.768, lng: -122.511}
	  // Note that Javascript allows us to access the constant
	  // using square brackets and a string value as its
	  // "property."
	  travelMode: google.maps.TravelMode[selectedMode]
	}, function(response, status) {
	  if (status == 'OK') {
	    directionsDisplay.setDirections(response);
	  } else {
	    window.alert('Directions request failed due to ' + status);
	  }
	});
}

function moveMap(center){
	console.log(center)
	map.setCenter(center); 
}


//abbr
//gtfs_latitude
//gtfs_longitude
function getLocation(abbr){
	for(station of stations){
		if(abbr === station.abbr){
			return {"lat":Number(station.gtfs_latitude),"lng":Number(station.gtfs_longitude)}
		}
	}
}



function serverJSONRequest(url, type, callback){
	$.ajax({
        url: url,
        type: type,
        dataType: 'json', 
        success: callback
    });
}
function parseRouteArray(routes){
	if(routes === undefined){
		return ""
	}
	let str = ""
	for(route of routes){
		str += route.substring(6) + ", ";
	}

	return str.substring(0,str.length-2);
}
function parsePlatformArray(platforms){
	if(platforms === undefined){
		return ""
	}
	let str = ""
	for(platform of platforms){
		str += platform + ", ";
	}

	return str.substring(0,str.length-2);
}



function getTransitInfo(){
	if(!autoUpdatingTransit){
		autoUpdatingTransit = true;
		window.setInterval(getTransitInfo, 30000);
	}
	if(data.sourceStation !== lastMapsPath.orig || data.destStation !== lastMapsPath.dest){//google maps
		calculateAndDisplayRoute(getLocation(data.sourceStation),getLocation(data.destStation))


		lastMapsPath.orig = data.sourceStation;
		lastMapsPath.dest = data.destStation;
	}


	serverJSONRequest('/trips?source='+data.sourceStation +'&dest='+data.destStation,'GET',function(res){

		console.log(res);

		let transitContentContainer = $("#transitContentContainer");
		transitContentContainer.html("")

		$("#destStationTransitHeader").html(data.destStation);

		$("#sourceStationTransitHeader").html(data.sourceStation);


		transitContentContainer.show();
		$("#transitHeader").show();



		
		let trips = res.schedule.request.trip;
		let first = true;
		let departureTime;
		for(trip of trips){

			let tripElement = '<div class="row m-0 p-2 pb-3 border-top ">'
					
			tripElement += 	'<div class="col-5"><h5>' + trip["@origTimeMin"] + '</h5><p>$' + trip["@fare"] + '</p><p class="font-italic small">' + trip["@tripTime"] + ' mins</p></div>'
			//legs
			tripElement += '<div class="col-7">' 
			if(first){
				first = false;

				departureTime = trip["@origTimeMin"]
				if(departureTime.indexOf("PM") > 0){
					departureTime = (Number(departureTime.substring(0,2)) + 12) + departureTime.substring(2,5)
				}
				else{
					departureTime = departureTime.substring(0,5)
				}
				departureTime = trip["@origTimeDate"] + " " + departureTime;

				let departureDate = new Date(departureTime);
				let currentDate = new Date()
				let diffM = Math.floor((departureDate - currentDate)/60000);

				


				tripElement += '<p class="text-danger">departs in <span id="clock">' + diffM + '</span></p>' 
			}

			tripElement += '<p >' + trip["@origin"] +'  :  ' + trip["@origTimeMin"]+'</p>' 
			for(legPiece of trip.leg){
				
				tripElement += '<p>' + legPiece["@destination"] +'  :  ' + legPiece["@destTimeMin"]+ '</p>' 
			}


			tripElement += '</div>'

			tripElement += '</div>'
			transitContentContainer.append(tripElement)
			$('span#clock').countdown(departureTime,function(event) {
			    $(this).html(event.strftime('%H:%M:%S'));
			  });

		}

		//calculateAndDisplayRoute(directionsService, directionsDisplay, trips[0].);


		

	});
}



function getSourceStationInfo(){


	if(!mapsInit){
		mapsInit = true;
		initMap(getLocation(data.sourceStation));
		
	}
	else{
		moveMap(getLocation(data.sourceStation))
	}

	serverJSONRequest('/station?station='+data.sourceStation,'GET',function(res){
		console.log(res);
		$("#sourceStationHeader").html(res.name);
		$("#sourceStation-city").html(res.city);
		if(res.north_routes.route){
			$("#sourceStation-NB").html(parseRouteArray(res.north_routes.route));
			$("#sourceStation-NBP").html(parsePlatformArray(res.north_platforms.platform));
			$("#sourceStation-NB-container").show();
			$("#sourceStation-NBP-container").show();
		}
		else{
			$("#sourceStation-NB-container").hide();
			$("#sourceStation-NBP-container").hide();
		}
		if(res.south_routes.route){
			$("#sourceStation-SB").html(parseRouteArray(res.south_routes.route));
			$("#sourceStation-SBP").html(parsePlatformArray(res.south_platforms.platform));
			$("#sourceStation-SB-container").show();
			$("#sourceStation-SBP-container").show();
		}
		else{
			$("#sourceStation-SB-container").hide();
			$("#sourceStation-SBP-container").hide();
		}


		$("#sourceStationInfo").show();
	})
}



$(document).ready(function() {



	let timesVisited = localStorage.getItem('timesVisited');
	timesVisited = timesVisited === undefined?0:Number(timesVisited);

	if(timesVisited > 0){
		console.log(timesVisited)
		$("#visitNum").html(timesVisited);
		$("#visitAlert").show();
	}


	localStorage.setItem('timesVisited',timesVisited+1)

	
	serverJSONRequest('/stations','GET',function(res){
		stations = res

		let sourceList = $('#source-station-list');
		let destList = $('#dest-station-list');

		for(station of stations){
			let stationListElement =  '<a class="list-group-item list-group-item-action" data-toggle="list" abbr='+ station.abbr+' href> ' + station.name +'</a>';
			sourceList.append(stationListElement);
			destList.append(stationListElement);
		}

		//user selected a source station
		$('#source-station-list a').on('click', function (e) {
		  e.preventDefault()
		  if(data.sourceStation !== undefined){
		  		$('#dest-station-list a[abbr="' + data.sourceStation+ '"] ').removeClass('disabled');

		  }
		  data.sourceStation = $(this).attr('abbr')
		  destList.removeClass('disabledDiv');
		  $('#dest-station-list a[abbr="' + data.sourceStation+ '"] ').addClass('disabled');
		  
		  


		  getSourceStationInfo();
		  

		  if(data.destStation !== undefined){
		  	getTransitInfo();
		  }



		  
		})
		$('#dest-station-list a').on('click', function (e) {
		  e.preventDefault()

		  if(data.destStation !== undefined){
		  		$('#source-station-list a[abbr="' + data.destStation+ '"] ').removeClass('disabled');

		  }
		  data.destStation = $(this).attr('abbr');

		  

		  $('#source-station-list a[abbr="' + data.destStation+ '"] ').addClass('disabled');


		  getTransitInfo();

		 




		})



	})



});



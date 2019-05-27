//Jackson Wheeler 5/27/19 COEN 315 Assignment 4
//required globals

let data = {'sourceStation':undefined,'destStation':undefined};
let autoUpdatingTransit = false;//whether source and dest have been picked yet
let stations = [];//populated by call to /stations

let lastMapsPath = {"orig":undefined, "dest":undefined}//avoid needlessly updating google maps directions
let mapsInit = false;
let map;
let directionsService;
let directionsDisplay;


function initMap(center) {
	
	directionsDisplay = new google.maps.DirectionsRenderer;
	directionsService = new google.maps.DirectionsService;
	map = new google.maps.Map(document.getElementById('map'), {
	  zoom: 14,
	  center: center
	});
	directionsDisplay.setMap(map);


}

function calculateAndDisplayRoute(orig, dest) {
	
	var selectedMode = 'TRANSIT';
	directionsService.route({
	  origin: orig, 
	  destination: dest,  
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

//get lat and long from station abbreviation
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

//ajax helper
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


//populate the transit information box
function getTransitInfo(){
	if(!autoUpdatingTransit){
		autoUpdatingTransit = true;
		window.setInterval(getTransitInfo, 30000);
	}
	if(data.sourceStation !== lastMapsPath.orig || data.destStation !== lastMapsPath.dest){//google maps
		calculateAndDisplayRoute(getLocation(data.sourceStation),getLocation(data.destStation));


		lastMapsPath.orig = data.sourceStation;
		lastMapsPath.dest = data.destStation;
	}

	//request transit info from source to dest, from bart api through server
	serverJSONRequest('/trips?source='+data.sourceStation +'&dest='+data.destStation,'GET',function(res){
		
		let transitContentContainer = $("#transitContentContainer");
		transitContentContainer.html("");

		$("#destStationTransitHeader").html(data.destStation);

		$("#sourceStationTransitHeader").html(data.sourceStation);


		transitContentContainer.show();
		$("#transitHeader").show();
		
		let trips = res.schedule.request.trip;
		let first = true;
		let departureTime;
		//render trips into transit content container
		for(trip of trips){

			let tripElement = '<div class="row m-0 p-2 pb-3 border-top ">';
					
			tripElement += 	'<div class="col-5"><h5>' + trip["@origTimeMin"] + '</h5><p>$' + trip["@fare"] + '</p><p class="font-italic small">' + trip["@tripTime"] + ' mins</p></div>';
			//legs of trip go in this div
			tripElement += '<div class="col-7">'; 
			if(first){//trip that will depart soonest
				first = false;

				//parse departure date from the trip info

				departureTime = trip["@origTimeMin"];
				if(departureTime.indexOf("PM") > 0){
					departureTime = (Number(departureTime.substring(0,2)) + 12) + departureTime.substring(2,5);
				}
				else{
					departureTime = departureTime.substring(0,5);
				}
				departureTime = trip["@origTimeDate"] + " " + departureTime;

				let departureDate = new Date(departureTime);
				let currentDate = new Date();
				let diffM = Math.floor((departureDate - currentDate)/60000);

				//add the clock element
				tripElement += '<p class="text-danger">departs in <span id="clock">' + diffM + '</span></p>';
			}

			tripElement += '<p >' + trip["@origin"] +'  :  ' + trip["@origTimeMin"]+'</p>';
			for(legPiece of trip.leg){
				tripElement += '<p>' + legPiece["@destination"] +'  :  ' + legPiece["@destTimeMin"]+ '</p>';
			}

			tripElement += '</div>';

			tripElement += '</div>';

			transitContentContainer.append(tripElement);
			//activate the clock element created in the trip that departs soonest

			$('span#clock').countdown(departureTime,function(event) {
			    $(this).html(event.strftime('%H:%M:%S'));
			});
		}
		
	});
}


//populate the source station info box
function getSourceStationInfo(){

	//if maps arent initialized, start maps, and select source station as the center
	if(!mapsInit){
		mapsInit = true;
		initMap(getLocation(data.sourceStation));
		
	}
	else{
		//otherwise set the center of the map to the source station
		moveMap(getLocation(data.sourceStation));
	}
	//get detailed info about the station from the barts api through our server
	serverJSONRequest('/station?station='+data.sourceStation,'GET',function(res){
		
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


// "main" 
$(document).ready(function() {

	//do pagevisits for Part 3
	let timesVisited = localStorage.getItem('timesVisited');
	timesVisited = timesVisited === undefined?0:Number(timesVisited);

	if(timesVisited > 0){
		$("#visitNum").html(timesVisited);
		$("#visitAlert").show();
	}

	localStorage.setItem('timesVisited',timesVisited+1)

	//populate stations array, setup action triggers 
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

			//re-enable destination list
			destList.removeClass('disabledDiv');

			//disable selection of the source station in the destination list
			$('#dest-station-list a[abbr="' + data.sourceStation+ '"] ').addClass('disabled');

			getSourceStationInfo();

			if(data.destStation !== undefined){
				getTransitInfo();
			}

		})


		//user selected a destination station
		$('#dest-station-list a').on('click', function (e) {
			e.preventDefault()

			if(data.destStation !== undefined){
				$('#source-station-list a[abbr="' + data.destStation+ '"] ').removeClass('disabled');
			}
			data.destStation = $(this).attr('abbr');

			//disable selection of the destination station in the source list
			$('#source-station-list a[abbr="' + data.destStation+ '"] ').addClass('disabled');

			getTransitInfo();

		})


	})
});



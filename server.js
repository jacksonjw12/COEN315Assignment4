// var url = require("url");
var http = require('http');
var express = require('express');
var app = express();
var server = http.createServer(app);
var bodyParser = require('body-parser')




function getJSON(uri,callback){
	http.get(uri,function(APIres){
		console.log('URI: ' + uri);
		console.log('STATUS: ' + APIres.statusCode);
		let bodyChunks = [];
		APIres.on('data', function(chunk){

			bodyChunks.push(chunk);
		}).on('end', function(){

			let body = Buffer.concat(bodyChunks);
			body = JSON.parse(body);
			callback(body);
		
		})

	});
}

function start() {

	
	
	
	//app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	  extended: true
	}));
	app.use(bodyParser.json());

	app.use('/static', express.static('node_modules'));
	app.use(express.static(__dirname + '/public/html'));
	app.use(express.static(__dirname + '/public/js'));
	app.use(express.static(__dirname + '/public/css'));



	app.get('/', function (req, res) {
		res.sendFile(__dirname + '/html/index.html')
	});
	
	let sentInfo = {};
	app.get('/sendInfo',function(req,res){
		console.log(JSON.stringify(req.query));
		sentInfo = req.query
		res.send({})
	});

	
	app.get('/stations',function(req, res){
		
		getJSON('http://api.bart.gov/api/stn.aspx?cmd=stns&key=MW9S-E7SL-26DU-VV8V&json=y',function(body){
			res.send(body.root.stations.station);
		})

	});

	app.get('/trips', function(req, res){

		let source = req.query.source;
		let dest = req.query.dest;
		if(source !== undefined && dest !== undefined){

			getJSON('http://api.bart.gov/api/sched.aspx?cmd=depart&key=MW9S-E7SL-26DU-VV8V&orig=' + source + '&dest=' + dest + '&date=now&b=0&a=4&l=1&json=y', function(body){
				res.send(body.root)
			})


		}
		


	});

	app.get('/station', function(req, res){
		let station = req.query.station;
		if(station !== undefined && station.length == 4){
			getJSON('http://api.bart.gov/api/stn.aspx?cmd=stninfo&key=MW9S-E7SL-26DU-VV8V&orig=' + station + '&json=y',function(body){
				res.send(body.root.stations.station);
			})
		}
		else{
			res.status(400).send({
			   message: 'No Station Sent!'
			});
		}
	});






	var port = 8082;
	if(process.platform === "linux"){
		port = 8082
	}

	server.listen(port);





	console.log("Server has started on port:" + port);
}

exports.start = start;

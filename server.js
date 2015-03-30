#!/bin/env node

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var support = require('./public/js/support');

var app = express();
var rooms=[];

var IDListArray={};
var IDDictArray={};
var currentIDArray={};
var playList={};

var server_port = process.env.OPENSHIFT_NODEJS_PORT || 8000;
var server_ip_address = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.all('/', function(req, res, next){
    var room = support.getNewRoom(rooms);
    res.redirect("/session/" + room);
});

/* GET users listing. */
app.all('/session/:id([0-9]+)', function(req, res) {
    var id=req.params.id;
	res.setHeader("sessionID", id);
    res.sendFile( path.resolve(__dirname + '/views/index.html') );
	app.use(express.static( __dirname + '/public' ) );
});

var numOfClientArray = {};
var numOfClient = 0;

var server = app.listen(server_port, server_ip_address, function () {
                        console.log( "Listening on " + server_ip_address + ", server_port " + server_port )
                        });
var io = require( 'socket.io' )( server );
io.on('connection', function(socket){
	  //clientNum=clientNum+1;
	socket.on('command',function(sessionID,command){
		console.log(command);
                io.to(sessionID).emit('command',command);
                });
numOfClient = numOfClient + 1;
	var sessionId = null;
    console.log( 'New user connected' );
    console.log('Number of clients: ' + numOfClient);
	
    socket.on( 'disconnect', function() {
    	numOfClient = numOfClient - 1;

		numOfClientArray[sessionId] -= 1;
		if(numOfClientArray[sessionId] == 0){
    		IDListArray[sessionId] = null;
			IDDictArray[sessionId] = null;
			playList[sessionId] = null;
    	}

	} );				
	socket.on('register',function (sessionID){
		
		socket.join(sessionID);
		sessionId = sessionID; 
		IDListArray[sessionID] = [];
		IDDictArray[sessionID] = {};
		playList[sessionID] = false;
				if(numOfClientArray[sessionID]){
			numOfClientArray[sessionID] += 1;
		}else{
			numOfClientArray[sessionID] = 1;
		}
		io.to(sessionID).emit('register',true);
		
	});

	socket.on('sync', function( sessionID,data ) {
		if(!playList[sessionID]){
			if(data != null){
				IDListArray[sessionID] = data[0];
				IDDictArray[sessionID] = data[1];
				playList[sessionID] = true;
		    	io.to(sessionID).emit('syncLocal',true);
	    	}else{
	    		playList[sessionID] = false;
	    		io.to(sessionID).emit('syncLocal',true);
	    	}
    	}else{ 
    		io.to(sessionID).emit('syncServer', [IDListArray[sessionID], IDDictArray[sessionID]]);
    	}
	} );
	
    	socket.on( 'addVideo', function( sessionID,videoID ) {
    	var name = '';
		var http = require('http');
		var options = 'http://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=' + videoID ;
		var request = http.request(options, function (res) {
		    var data = '';
		    res.on('data', function (chunk) {
		        data += chunk;
		    });

		    res.on('end', function () { 
		        if( data != 'Not Found'){
		        	var videoInfo = JSON.parse(data); 
		        	name = videoInfo.title;
		        	io.to(sessionID).emit('name',[true,videoID,name]);
		        }else{
		        	io.to(sessionID).emit('name',[false,videoID,'']);
		        }	     		    	
		    });
		});
		request.on('error', function (e) {
		    console.log(e.message);
		});
		request.end();
	} );
	
		socket.on('clear', function (sessionID,data){
		io.to(sessionID).emit('clear',true);
		IDListArray[sessionID] = [];
		IDDictArray[sessionID] = {};
		playList[sessionID] = false;

	});
	
		socket.on('update', function (sessionID,data){
		IDListArray[sessionID] = data[0];
		IDDictArray[sessionID] = data[1];
		
		playList[sessionID] = true;
		io.to(sessionID).emit('syncServer', [IDListArray[sessionID], IDDictArray[sessionID]]);

	});
	
		socket.on('playVideo',function (sessionID, targetID){
		io.to(sessionID).emit('playVideo',targetID);
		
	});

} );

	
	
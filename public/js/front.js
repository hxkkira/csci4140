
var req = new XMLHttpRequest();
req.open('GET', document.location, false);
req.send(null);
var sessionID = req.getResponseHeader('sessionID');


//QRcode
//=======================================
function addQRCode(){
	var CurrentUrl = encodeURIComponent(location.href);
	var src = 'https://chart.googleapis.com/chart?cht=qr&chs=150x150&chl=' + CurrentUrl;
	var qrcode = document.getElementById('qrcode');
	var img = document.createElement('img');
	img.src = src;
	qrcode.appendChild(img);
	
}
//=======================================

//Playlist
//=======================================
var playlist;
var IDList=[];
var currentID='';
var videoName='';
var IDDict={};

if(localStorage.IDList){
	IDList=JSON.parse(localStorage.IDList);
}else{
	IDList=[];
}

if(localStorage.IDDict){
	IDDict=JSON.parse(localStorage.IDDict);
}else{
	IDDict={};
}



function displayPlaylist(){
	playlist = document.getElementById('playlist');
	while (playlist.firstChild) {
		 playlist.removeChild(playlist.firstChild);
	 }

	for (var i = 0; i<IDList.length; i++) {
		var item = IDList[i];
		var name = IDDict[IDList[i]];
		var list = document.createElement('li');
		list.setAttribute("class","list-group-item");
		var textSpan = document.createElement('span');
		var text = document.createTextNode(item + ' : ' + name + '  ');
		textSpan.appendChild(text);
		//<button type="button" class="btn btn-warning btn-block"><span class="glyphicon glyphicon-volume-up" aria-hidden="true"></span><div class="visible-sm-inline">UNMUTE</div></button>
		//glyphicon glyphicon-remove
		textSpan.id = item;
		textSpan.onclick = function(){ playVideoByID(this);};
		list.appendChild(textSpan);
		var button = document.createElement('button');
		button.id = item;
		button.type = 'button';
		button.class = 'btn btn-warning btn-block';
		button.innerHTML = 'X';
		button.style.float = 'right';
		button.style.color = 'red';
		button.onclick = function(){ deleteID(this);};
		list.appendChild(button);
		button.onclick = function(){ deleteID(this);};
		list.appendChild(button); 
		playlist.appendChild(list);
	}

}

// function addID(){
	    // //alert("You clicked addID!");
		// playlist = document.getElementById('playlist');
		// var ID = ID_parser(document.getElementById('ID').value); //need to handle the value
		// IDList.push(ID);
		// localStorage.IDList = JSON.stringify(IDList);
		// if (currentID==null){
			// currentID=ID;
			// player.loadVideoById(currentID);
		// }
		// displayPlaylist();
// };

function playVideoByID(object){
	
	var targetID = object.id;
	//alert(targetID);
	socket.emit('playVideo',sessionID,targetID);

}

function deleteID(object){
	var targetID = object.id;
	IDList.splice(IDList.indexOf(targetID), 1);
	localStorage.IDList = JSON.stringify(IDList); 
	socket.emit('update', sessionID,[IDList,IDDict]);

}

function clearList(){
	IDList=[];
	currentID='';
	videoName='';
	IDDict={};
	localStorage.clear();
	displayPlaylist();
};


//=======================================


// youtube iframe
//=======================================
var tag = document.createElement( 'script' );
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName( 'script' )[ 0 ];
firstScriptTag.parentNode.insertBefore(tag,firstScriptTag );

var player;

if(IDList.length > 0){ 
	currentID = IDList[0];
}else{
	currentID = null;
}

localStorage.currentID = currentID;

function onYouTubeIframeAPIReady() {
	player = new YT.Player( 'player', {
		height : '390',
		width : '640',
		playerVars: { 'controls' : 0 },
		videoId : currentID,//videoID, //videoId
		events : {
			'onReady': onPlayerReady,
			'onStateChange': onPlayerStateChange
		}
	} );
}

function onPlayerReady( event ) {
//do nothing
//event.target.playVideo();
}

var done = false;
function onPlayerStateChange( event ) { 

	if(event.data == YT.PlayerState.ENDED){
	var currentIndex = IDList.indexOf(currentID);
	if(currentIndex == -1 ){}
	else if(currentIndex < IDList.length-1){
		currentID = IDList[currentIndex + 1];
		player.loadVideoById(currentID);
	}
}
	}

function stopVideo() {
	player.stopVideo();
}
//=======================================

function playByID(object){
	
	var targetID = object.id;
	currentID=targetID;
	player.loadVideoById(currentID);
	player.playVideo();

}
//control functions
//=======================================
function play(){
	if(player){
	player.playVideo();
	}
};

function pause(){
	if(player){
	player.pauseVideo(); 
	}
};

function stop(){
	if(player){
	player.stopVideo();
	player.loadVideoById(currentID);
	player.stopVideo();
	}
};

function mute(){
	if(player){
	player.mute();
	}
}

function unmute(){
	if(player){
	player.unMute(); 
	}
}

function rewind(){
	if(player){
	var currentTime = player.getCurrentTime();
	player.seekTo( currentTime - 2.0 ); 
	}

}

function forward(){
	if(player){
	var currentTime = player.getCurrentTime();
	player.seekTo( currentTime + 2.0 ); 
	}

}

function previous(){
	if(player){
	var currentIndex = IDList.indexOf(currentID);
	if(currentIndex > 0){
		currentID = IDList[currentIndex - 1];
		player.loadVideoById(currentID);
	}
	}
}

function next(){
	if(player){
	var currentIndex = IDList.indexOf(currentID);
	if(currentIndex == -1 ){}
	else if(currentIndex < IDList.length-1){
		currentID = IDList[currentIndex + 1];
		player.loadVideoById(currentID);
	}
	}
}
window.addEventListener( 'resize', function() {
	if ( window.innerWidth >= 992 ) {
		if ( player === null ) {
			player = new YT.Player( 'player', {
			height : '390',
			width : '640',
			playerVars: { 'controls' : 0 }, 
			videoId : currentID, 
			events : {
				'onReady': onPlayerReady,
				'onStateChange': onPlayerStateChange
				}
			} );
		}
	} else {
		player.destroy(); 
		player = null;
	}
} )

//=======================================

//client control
//=======================================
var IDchecker = false;

function ID_parser(url){
    if(url.length == 11){
        return url;
    }else{
        var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        var match = url.match(regExp);
        if (match && match[2].length == 11) {
            return match[2];
        } else {
            return null;
        }
    }
}

function addControl(){
	
	document.getElementById("play").onclick = function(){sendCommand('play');};
	document.getElementById("stop").onclick = function(){sendCommand('stop');};
	document.getElementById("pause").onclick = function(){sendCommand('pause');};
	document.getElementById("mute").onclick = function(){sendCommand('mute');};
	document.getElementById("unmute").onclick = function(){sendCommand('unmute');};
	document.getElementById("rewind").onclick = function(){sendCommand('rewind');};
	document.getElementById("forward").onclick = function(){sendCommand('forward');};
	document.getElementById("previous").onclick = function(){sendCommand('previous');};
	document.getElementById("next").onclick = function(){sendCommand('next');};
	
	document.getElementById("addID").onclick = function(){
	var ID = ID_parser(document.getElementById('ID').value); 
	socket.emit('addVideo',sessionID,ID); 
	IDchecker = true;}; 
	
	document.getElementById("clearList").onclick = function(){socket.emit('clear',sessionID,true); };
}

function receiveCommand(command){
	switch(command){
		case 'play':
			play();
			break;
		case 'stop':
			stop();
			break;
		case 'pause':
			pause();
			break;
		case 'mute':
			mute();
			break;
		case 'unmute':
			unmute();
			break;
		case 'rewind':
			rewind();
			break;
		case 'forward':
			forward();
			break;
		case 'previous':
			previous();
			break;
		case 'next':
			next();
			break;
		default:

	}
}

function sendCommand(command){
	socket.emit('command',sessionID,command);
}

function addSocketListener(){

	socket.on('command',function (data){
		receiveCommand(data);
	});

	socket.on('syncServer', function (data){
		
		IDList = data[0];
		IDDict = data[1];
		if(IDList == null) {IDList = []};
		if(IDDict == null) {IDDict = {}};
		localStorage.IDList = JSON.stringify(IDList);
		localStorage.IDDict = JSON.stringify(IDDict); 	 
		displayPlaylist();

	});
	
	socket.on('syncLocal', function (data){
		displayPlaylist();

	});

	socket.on('name',function (data){

		var valid = data[0];
		var ReceivedID = data[1];
		var name = data[2];
		if(valid){
			localStorage.setItem(ReceivedID,name);
			IDList.push(ReceivedID);
			IDDict[ReceivedID] = name;
			localStorage.IDList = JSON.stringify(IDList);
			localStorage.IDDict = JSON.stringify(IDDict); 
			socket.emit('update',sessionID,[IDList, IDDict]);
			IDchecker = false;

		}else{
			if(IDchecker){
				alert('Invalid Video ID!');
				IDchecker = false;
			}
		}
	});

	socket.on('clear',function (data){
		localStorage.clear();
		IDList = [];
		IDDict = {};
		currentID = null;
		stop();
		displayPlaylist();
	});
	
	socket.on('register',function(data){
		// register session done, sync playlist with server
		if(localStorage.IDList != null){
		//socket.emit('sync',localStorage);
			socket.emit('sync',sessionID,[IDList, IDDict]);
		}else{
			socket.emit('sync',sessionID,null);
		}	
	});
	socket.on('playVideo', function(targetID){
		player.loadVideoById(targetID);
		currentID = targetID;
		play();
	});
	
	
	
}

function syncPlayList(playListData){
	socket.emit('register',sessionID);
};

//=======================================
function addLoadEvent(func) {
  var oldonload = window.onload;
  if (typeof window.onload != 'function') {
    window.onload = func;
  } else {
    window.onload = function() {
      oldonload();
      func();
    }
  }
}
//=======================================
addLoadEvent(addQRCode);
addLoadEvent(addControl);
addLoadEvent(addSocketListener);
addLoadEvent(syncPlayList);
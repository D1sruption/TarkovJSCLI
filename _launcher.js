const settings = require('electron-settings');
const ipc = require('electron').ipcMain;
require('./globals.js');

let GameMajorVersion;

const paths = [
	/* 0	*/ "/launcher/token/refresh",
	/* 1	*/ "/launcher/hardwareCode/activate",
	/* 2	*/ "/launcher/logout",
	/* 3	*/ "/launcher/login",
	/* 4	*/ "/launcher/queue/status",
	/* 5	*/ "/launcher/game/start",
	/* 6	*/ "/launcher/analytics",
	/* 7	*/ "/launcher/config",
	/* 8	*/ "/launcher/setDataCenters",
	/* 9	*/ "/launcher/dataCenter/list",
	/* 10	*/ "/launcher/server/list",
	/* 11	*/ "/launcher/GetUnpackedDistrib?version={yourgameversion}",
	/* 12	*/ "/launcher/GetPatchList",
	/* 13	*/ "/launcher/GetLauncherDistrib",
	/* 14	*/ "/launcher/GetDistrib",
	/* 15	*/ "/client/game/profile/select",
]

/* **** BODY_DEFLATE FUNCTION **** */
function zlibBody(res, path){
	return new Promise( function( resolve, reject ) {
		zlib.inflate(res, function(err, buffer) {
			if(err){
				log.info("Error with inflate:");
				reject(err);
			}
			resolve(buffer);
		});
	});
}

/* **** SENDER FUNCTION **** */
function send_launcher(url, _port = 443, path, data){
	return new Promise ((resolve, reject) => {
		const options = { // options for https data it must stay like this
		  hostname: url,
		  port: _port,
		  path: path,
		  method: 'POST',
		  headers: {
			  'User-Agent':			'BSG Launcher ' + launcherVersion,
			  'Content-Type': 		'application/json',
			  'Method': 			'POST'
		  } 
		};
		zlib.deflate(data, function (err, buffer) { // this is kinda working
			const req = http.request(options, (res) => { // request https data with options above
				// check if PHPSESSID isnt setted already - for more then 1 request
				if(PHPSESSID == '') 
					PHPSESSID = res.headers['set-cookie'][1].replace("; path=/", "").replace("PHPSESSID=",""); // properly grab PHPSESSID from server
				if(L_TOKEN == '')
					L_TOKEN = '';
					// display whats going on
				//console.log("[URL] " + path + " [StatusCode]" + res.statusCode); 

				let chunks = [];
				res.on('data', (d) => {
					chunks.push(d);
				});
				res.on('end', function(){
					resolve(Buffer.concat(chunks));
				});
			});
			// return error if error on request
			req.on('error', err => {
				reject(err); 
			});
			req.write(buffer);
			req.end();
		});
	});
}

function sendSessionRequest(url, _port = 443, path, data){
	return new Promise ((resolve, reject) => {
		const options = { // options for https data it must stay like this
		  hostname: url,
		  port: _port,
		  path: path,
		  method: 'POST',
		  headers: {
			  'User-Agent':			'BSG Launcher ' + launcherVersion,
			  'Content-Type': 		'application/json',
			  'Method': 			'POST',
			  'Authorization': 		settings.get("Profile.access_token")
		  } 
		};
		zlib.deflate(data, function (err, buffer) { // this is kinda working
			const req = http.request(options, (res) => { // request https data with options above
				// check if PHPSESSID isnt setted already - for more then 1 request
				if(PHPSESSID == '') 
					PHPSESSID = res.headers['set-cookie'][1].replace("; path=/", "").replace("PHPSESSID=",""); // properly grab PHPSESSID from server
				if(L_TOKEN == '')
					L_TOKEN = '';
					// display whats going on
				//;lconsole.log("[URL] " + path + " [StatusCode]" + res.statusCode); 

				let chunks = [];
				res.on('data', (d) => {
					chunks.push(d);
				});
				res.on('end', function(){
					resolve(Buffer.concat(chunks));
				});
			});
			// return error if error on request
			req.on('error', err => {
				reject(err); 
			});
			req.write(buffer);
			req.end();
		});
	});
}

/* **** MAIN EXECUTABLE FUNCTION **** */
async function LauncherRequests(){
	//set randomized phpsessid
	var rString = util.randomizeID()
	settings.set("Profile.PHPSESSID", rString)

	let path = paths;
	let dataLogin = "{\"email\":\"" + settings.get("Profile.username") + "\",\"pass\":\"" + settings.get("Profile.password") + "\",\"hwCode\":\"" + settings.get("Profile.hwCode") + "\",\"captcha\":\"true\"}"
	let startGameData = JSON.stringify({
		version: {
			major: settings.get("GameConstants.GameMajor"),
			game: "live",
			backend: "6"
		},
		hwCode: settings.get("Profile.hwCode")
	});

	InternalRequest_Launcher(launcher_url, path[14], "");
	InternalRequest_Launcher(launcher_url, path[13], "");
	
	//console.log("StartGameData: " + startGameData);
	setTimeout(() => {

		InternalRequest_Launcher(launcher_url, path[3], dataLogin); //get access_token

		setTimeout(() => {

			InternalRequest_Prod(url, path[5], startGameData); //get session_token
		}, 2000);
		
		//console.log("Sending to this path: " + url + path[5]);
		//console.log("With data: " + startGameData);
	}, 2000);
	
}
/* **** SEPARATE URL RESOLVER FUNCTION **** */
async function InternalRequest_Launcher(launcher_url, path, data){
	let res = await send_launcher(launcher_url, 443, path, data);
	let body = await zlibBody(res, path);
	let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
	body = body.toString("utf-8");
	if(body != ""){
		if(path == "/launcher/GetDistrib"){ 		// gameVersion
			let tempData = JSON.parse(body);
			gameVersion	= tempData['data']['Version'];
			GameMajorVersion = gameVersion;
			settings.set("Versions.GameMajorVersion", GameMajorVersion);
			console.log("[VERSIONS] game:" + GameMajorVersion);
		}
		if(path == "/launcher/GetLauncherDistrib"){ // launcherVersion
			let tempData = JSON.parse(body);
			launcherVersion	= tempData['data']['Version'];
			settings.set("Versions.LauncherVersion", launcherVersion);
			console.log("[VERSIONS] launcher:" + launcherVersion);
		}
		if(path == "/launcher/login"){
			let tempData = JSON.parse(body);
			let errCode = tempData['err'];
			let errMsg = tempData['errmsg'];

			//console.log(tempData)
			if(errCode == 230) {
				let sleepTime = tempData['data']['ban_time_left'];
				console.log("Ban Time Left: " + tempData['data']['ban_time_left']);
				console.log(`Sleeping for ${sleepTime}`);
				util.sleep(sleepTime)
			}
			else if(errCode == 206) {
				console.log(errMsg)
			} else if(errCode == 214) {
				console.log("Captcha Required!")
			} else {
				access_token = tempData['data']['access_token'];
				//console.log("access_token: " + access_token);
				settings.set("Profile.access_token", access_token);
				console.log("access_token grabbed successfully");
			}

		}
	} else {
		console.log(body);
	}
	/*if(path == "/launcher/login"){}*/
	util.writeJson(filename, body);
	util.sleep(1000);
}

async function InternalRequest_Prod(launcher_url, path, data){
	let res = await sendSessionRequest(launcher_url, 443, path, data);
	let body = await zlibBody(res, path);
	let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
	body = body.toString("utf-8");
	let tempData = JSON.parse(body);
	if(body != ""){
		if(path == "/launcher/game/start"){
			session_token = tempData['data']['session'];
			settings.set("Profile.session_token", session_token);
			console.log("Grabbed session_token successfully: " + settings.get("Profile.session_token"));
			ipc.emit("select-profile");
		}
	} else {
		console.log(body);
	}
	util.writeJson(filename, body);
	util.sleep(1000);
}

// export only executable function
module.exports.LauncherRequests = LauncherRequests;

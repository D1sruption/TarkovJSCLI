const settings = require('electron-settings');
const ipc = require('electron').ipcMain;
require('./globals.js');

PHPSESSID = settings.get("Profile.session_token");

/* **** SENDER FUNCTION **** */
function select_profile(url, _port = 443, path, data, type = "POST"){
	return new Promise ((resolve, reject) => {
		const options = { // options for https data it must stay like this
		  hostname: url,
		  port: _port,
		  path: path,
		  method: type,
		  headers: {
			  'User-Agent':			settings.get("GameConstants.UnityPlayerVersion"),
			  'Content-Type': 		'application/json',
			  'Accept': 			'application/json',
			  'App-Version': 		settings.get("GameConstants.AppVersion"),
			  'GClient-RequestId': 	integer,
			  'X-Unity-Version':    settings.get("GameConstants.XUnityVersion")
		  } 
		};
		//console.log(options);
		if(PHPSESSID !== ''){ // assign phpsessid only once
			options['headers']['Cookie'] = "PHPSESSID=" + settings.get("Profile.session_token");
		}
		integer++; // add integer number to request counting requests and also making their stupid RequestId Counter
		zlib.deflate(data, function (err, buffer) { // this is kinda working
			const req = http.request(options, (res) => { // request https data with options above
				//if(typeof res.headers['set-cookie'][1] != "undefined")
					//PHPSESSID = settings.get("Profile.session_token");//res.headers['set-cookie'][1].replace("PHPSESSID=","").replace("; path=/",""); // properly grab PHPSESSID from server
				//console.log("["+integer+"][URL]> " + path + " [StatusCode]" + res.statusCode);
				if(res.statusCode != 200){ 
					reject("No Response: " + res.statusCode);
				}
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
/* **** CLIENT REQEUSTS FUNCTION **** */
async function ClientRequests(){
	// paths to grab data from
	let path = [
		/* P_S	*/	"/client/game/profile/select"
	];	
	// body requests
	let data = [
		/* P_S	*/	'{"uid": "' + profileID + '"}'
	];
	let res = await select_profile(url, 443, path[0], data[0]);
	zlib.inflate(res, function(err, body) {
		let filename = "downloaded/" + path[0].substr(1).replace(/\//g, ".") + ".json";
			if(typeof body != "undefined"){
				body = body.toString("utf-8");
				//console.log(body);
				if(JSON.parse(body)['err'] == 0) {
					console.log("Profile selected!\n")

					//profile selected successfully
					ipc.emit("market-requests");
				}
				err = JSON.parse(body)['err'] != 0;
				if(err)
					console.log(JSON.parse(body)['errmsg']);
						
					util.writeJson(filename, body);
				} else {
					console.log("{undefined body !!}")
				}
	});
	await util.sleep(150);
	
}

// export only executable function
module.exports.ClientRequests = ClientRequests;

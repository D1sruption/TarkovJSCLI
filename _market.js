const settings = require('electron-settings');
const ipc = require('electron').ipcMain;
require('./globals.js');

PHPSESSID = settings.get("Profile.session_token");

async function MarketRequests(){
	QueryInventory();
	QueryMarket("57347ca924597744596b4e71");
	GetMarketAverage("57347ca924597744596b4e71");

	ipc.on("re-query", ()=> {
		setTimeout(() => {
			QueryMarket("57347ca924597744596b4e71");
		}, 1500);
	})

	ipc.on("buy-item", () => {
		BuyItem(settings.get("Market.MoneyStackID"), settings.get("Market.BestOfferID"), settings.get("Market.BestOfferCost"));
	})
}

/* **** SENDER FUNCTION **** */
function send_request(url, _port = 443, path, data, type = "POST"){
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
			  'GClient-RequestId': 	1,
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

async function QueryInventory() {
	let path = "/client/game/profile/list";
	let data = "";

	let res = await send_request(url, 443, path, data);
	zlib.inflate(res, function(err, body) {
		let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
			if(typeof body != "undefined"){
				body = body.toString("utf-8");
				data = JSON.parse(body)['data'];
				//console.log(JSON.parse(body)['data'][0]._id); //prints 5df78c2987ba573dcd7dc077
				//console.log(data[0].Inventory.items);

				//check if profile is correct
				if(data[0].Inventory.items.length > 25) {
					data = data[0];
				} else {
					data = data[1];
				}


				var i;
				var iLength = data.Inventory.items.length;
				console.log("\nNumber of unique items in inventory:" + iLength);
				var item;
				var totalMoney = 0;
				var numStacks = 0;
				for(i = 0; i < iLength; i++) {
					item = data.Inventory.items[i];
					var _id = item._id;
					var _tpl = item._tpl;
					//console.log(item.upd)
					if(_tpl == "5449016a4bdc2d6f028b456f") {
						numStacks++;
						totalMoney += item.upd.StackObjectsCount;
					}
				}

				console.log(`Total Money: ${numberWithCommas(totalMoney.toFixed(2))} in ${numStacks} stacks`);

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

async function QueryMarket(templateId) {
	//console.log("Querying market...");;
	var BestOfferID = "";
	var BestOfferCost = 0;

	let path = "/client/ragfair/find";
	let data = "{\"page\":0,\"limit\":1,\"sortType\":5,\"sortDirection\":0,\"currency\":0,\"priceFrom\":0,\"priceTo\":0,\"quantityFrom\":0,\"quantityTo\":0,\"conditionFrom\":0,\"conditionTo\":100,\"oneHourExpiration\":false,\"removeBartering\":true,\"offerOwnerType\":0,\"onlyFunctional\":true,\"updateOfferCount\":true,\"handbookId\":\"" + templateId + "\",\"linkedSearchId\":\"\",\"neededSearchId\":\"\",\"buildItems\":{ },\"buildCount\":0,\"tm\":1}";

	let res = await send_request(url_ragfair, 443, path, data);
	zlib.inflate(res, function(err, body) {
		let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
			if(typeof body != "undefined"){
				body = body.toString("utf-8");
				data = JSON.parse(body)['data'];
				var offers = data.offers;
				var cutoff = 1000000000;
				var costs;
				var oldOfferCost = 0;
				var newOfferCost = 0;
				//console.log(data.offers.length);

				for(var i = 0; i < offers.length; i++) {
					let offer = offers[i];
					if(offer.requirements[0]._tpl == "5449016a4bdc2d6f028b456f") {
						//console.log("Offer is for RUB");
						costs = offer.requirements[0].count;
						let diff = costs - settings.get("Market.FinalAverage");
						if(costs < settings.get("Market.FinalAverage") - 40000) {
							BestOfferID = offer._id;
							BestOfferCost = offer.requirements[0].count;
						
							settings.set("Market.BestOfferID", BestOfferID);
							settings.set("Market.BestOfferCost", BestOfferCost);
							console.log(`Best Offer ID: ${BestOfferID} | Best Offer Costs: ${BestOfferCost}`);

							//send buy request
							ipc.emit("get-money-stack", BestOfferCost);
						} else {
							//console.log("Offer requirements not met! " + costs + " | " + settings.get("Market.FinalAverage"));
							//console.log("Difference: " + diff);
							ipc.emit("re-query");
						}

					}
					//console.log(offers[i]._id + " | By: " + offers[i].user.nickname + " | For: " + numberWithCommas(offer.requirementsCost));
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

async function BuyItem(MoneyID, BestOfferID, BestOfferCost) {
	let path = "/client/game/profile/items/moving";
	let data = "{\"data\":[{\"Action\":\"RagFairBuyOffer\",\"offers\":[{\"id\":\"" + BestOfferID + "\",\"count\":1,\"items\":[{\"id\":\"" + MoneyID + "\",\"count\":" + BestOfferCost + "}]}]}],\"tm\":2}";

	//console.log("MoneyID: " + MoneyID + " | BestOfferID: " + BestOfferID + " | BestOfferCost: " + BestOfferCost);
	//console.log(data);
	let res = await send_request(url, 443, path, data);
	zlib.inflate(res, function(err, body) {
		let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
			if(typeof body != "undefined"){
				body = body.toString("utf-8");
				data = JSON.parse(body)['data'];
				let responseCode = JSON.parse(body)['err'];

				console.log(responseCode);
				console.log(data);

				err = JSON.parse(body)['err'] != 0;
				if(err)
					console.log(JSON.parse(body)['errmsg']);
						
					util.writeJson(filename, body);
				} else {
					console.log("{undefined body !!}")
				}
	});
	await util.sleep(150);

	ipc.emit('re-query');
}

async function GetMarketAverage(templateId) {
	let path = "/client/ragfair/find";
	let data = "{\"page\":0,\"limit\":5,\"sortType\":5,\"sortDirection\":0,\"currency\":0,\"priceFrom\":0,\"priceTo\":0,\"quantityFrom\":0,\"quantityTo\":0,\"conditionFrom\":0,\"conditionTo\":100,\"oneHourExpiration\":false,\"removeBartering\":true,\"offerOwnerType\":0,\"onlyFunctional\":true,\"updateOfferCount\":true,\"handbookId\":\"" + templateId + "\",\"linkedSearchId\":\"\",\"neededSearchId\":\"\",\"buildItems\":{ },\"buildCount\":0,\"tm\":1}";

	let res = await send_request(url_ragfair, 443, path, data);
	zlib.inflate(res, function(err, body) {
		let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
			if(typeof body != "undefined"){
				body = body.toString("utf-8");
				data = JSON.parse(body)['data'];
				var offers = data.offers;
				//console.log(data.offers.length);

				var Costs = 0;
				var CostsSum = 0;
				var FinalAverage = 0;
				var indexCount = 0;

				for(var i = 0; i < offers.length; i++) {
					let offer = offers[i];
					Costs = offer.requirementsCost;
					CostsSum += Costs;
					indexCount++;

				}

				FinalAverage = CostsSum / indexCount;
				settings.set("Market.FinalAverage", FinalAverage.toFixed(2));
				console.log(`\nAverage: ${numberWithCommas(FinalAverage)} over ${indexCount} total items`);

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

async function GetMoneyStackID(requiredAmount) {
	let path = "/client/game/profile/list";
	let data = "";

	let res = await send_request(url, 443, path, data);
	zlib.inflate(res, function(err, body) {
		let filename = "downloaded/" + path.substr(1).replace(/\//g, ".") + ".json";
			if(typeof body != "undefined"){
				body = body.toString("utf-8");
				data = JSON.parse(body)['data'];

				//console.log(data);

				//check if profile is correct
				if(data[0].Inventory.items.length > 25) {
					data = data[0];
				} else {
					data = data[1];
				}
				
				
				var i;
				var iLength = data.Inventory.items.length;
				var item;
				for(i = 0; i < iLength; i++) {
					item = data.Inventory.items[i];
					var _id = item._id;
					var _tpl = item._tpl;
					
					if(item.hasOwnProperty("upd")) {
						//console.log("item includes upd");
						var stackCount = item.upd.StackObjectsCount
						if(_tpl == "5449016a4bdc2d6f028b456f" && stackCount >= requiredAmount) {
							 console.log(`Required Amount: ${requiredAmount} | Stack Count: ${stackCount} | ID: ${_id}`);
							 settings.set("Market.MoneyStackID", _id);
							 ipc.emit("buy-item");
							 break;
						}
					}
					//console.log(item._id)

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

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
// export only executable function
module.exports.MarketRequests = MarketRequests;
module.exports.GetMoneyStackID = GetMoneyStackID;
module.exports.BuyItem = BuyItem;

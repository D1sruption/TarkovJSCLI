/* **** created by Ignition version 1.0 **** */
const ipc = require('electron').ipcMain;
const settings = require('electron-settings');
require('./globals.js');

/* ************************************************************************************************************* */

//console.log(">Launcher Url: " + launcher_url);
//console.log(">Game Url: " + url);
//console.log(">Trading Url: " + url_trade);
/* **** starting dumping launcher responses **** */
//console.log("game and launcher versions ...");
launcher_f.LauncherRequests();
/* **** starting dumping game responses **** */
//client_f.ClientRequests();
/* **** Finished **** */

ipc.on("select-profile", function(event, arg) {
    //console.log("Rx select-profile with: " + settings.get("Profile.session_token"));
    client_f.ClientRequests();
})

ipc.on("market-requests", function(event, arg) {
    //console.log("Rx select-profile with: " + settings.get("Profile.session_token"));
    //market_f.MarketRequests();
})

ipc.on("get-money-stack", function(event, arg) {
    console.log("Rx get-money-stack with: " + settings.get("Market.BestOfferCost"));
    market_f.GetMoneyStackID(settings.get("Market.BestOfferCost"));
})

ipc.on("buy-item", function(event, arg) {
    console.log("Rx buy-item with moneystack ID: " + settings.get("Market.MoneyStackID"));
    //market_f.BuyItem(settings.get("Market.MoneyStackID"), settings.get("Market.BestOfferID"), settings.get("Market.BestOfferCost"));
})



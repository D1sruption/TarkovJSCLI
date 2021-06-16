const settings = require("electron-settings");

//=====================================================
// import configuration
//const config = require('./config.json')
//settings.set("Config.Item", config.Item);
//settings.set("Config._tpl", config._tpl);
//console.log("IMPORTED CONFIG: " + settings.get("Config.Item"))
//console.log("IMPORTED CONFIG: " + settings.get("Config._tpl"))

//=====================================================
// initialize settings
settings.set("Profile.username", "tobiasdittmann95@gmx.net"); //username
settings.set("Profile.password", "1f0c9f3f66fbf184967d89395b4d36f0"); //MD5 of password
settings.set("Profile.hwCode", "hwCode:#1-cb77ec4540d9db7a136e7666f31890f76b1daeb5:821592e6fb74698796afbe1da729ffda56c35eec:b811167e5d60ec9ed5d93e2c7616363a6cb71107-3fb1316b466cdc99dc662f823cb370de913ba94c-be0394f173f6d152decc2226c1ef86f16c3481e5-788677fd0a8814b8fa1c47f1e2ff19468cfced5b-13903e48e21131cb20b59a0ca4fb86025bedd3ab-67a7d81e5a8e3fc19daef2fcb09bfbad"); //HWID
settings.set("Profile.uid", "5c3a695046b1687622070ceb");
settings.set("Profile.PHPSESSID", ""); //set dynamically
settings.set("Profile.access_token", ""); //set dynamically
settings.set("Profile.session_token", ""); //set dynamically

//initialize game constants
settings.set('GameConstants.GameMajor', "0.12.3.5985");
settings.set('GameConstants.UnityPlayerVersion', "UnityPlayer/2018.4.13f1 (UnityWebRequest/1.0, libcurl/7.52.0-DEV)");
settings.set('GameConstants.LauncherVersion', "0.9.3.1057");
settings.set('GameConstants.XUnityVersion', "2018.4.13f1");
settings.set('GameConstants.AppVersion', "EFT Client 0.12.3.5985");

//=====================================================
// main libraries
global.request 	= require('request');
global.fs		= require('fs');
global.zlib 	= require('zlib');
global.http 	= require('https');
//=====================================================
// global variables to change
global.gameVersion 		= ''; // should be auto updated
global.launcherVersion 	= ''; // should be auto updated
global.PHPSESSID 		= ''; // this need to be empty it will updated by script
global.launcher_url 	= "launcher.escapefromtarkov.com"; 	// launcher backend
global.url		        = "prod.escapefromtarkov.com";		// game backend
global.url_trade 		= "trading.escapefromtarkov.com";	// trading backend
global.url_ragfair 		= "ragfair.escapefromtarkov.com";	// ragfair backend (not sure if im not done any typo there)
global.userAgent 		= settings.get("GameConstants.UnityPlayerVersion");
global.backendVersion 	= '6';
global.taxonomyVersion 	= '341';
//=====================================================
// profile settings
global.hwCode = settings.get("Profile.hwCode");
global.access_token = '';
global.session_token = '';
////////// 
global.integer = 0; 		// incrementor used to not get banned ? who fucking knows
global.cookieString = ''; 	// not use ?
global.L_TOKEN = ''; 		// not use ?
global.profileID = settings.get("Profile.uid"); 		// your profile ID you should update it after login to game
global.language = 'en'; 	// not use ?
//=====================================================
// Local Script files
global.util 		= require('./utility.js');
global.launcher_f 	= require('./_launcher.js');
global.client_f 	= require('./_client.js');
global.market_f     = require('./_market.js');
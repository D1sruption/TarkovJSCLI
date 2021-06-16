const fs = require('fs');

function sleep(ms){
    return new Promise(resolve=>{
        setTimeout(resolve,ms);
    })
}
function writeJson(file, data) { //write json to file with tabulators and new lines
    fs.writeFileSync(file, data, 'utf8');
}


//Randomize PHPSESSID
function randomizeID() {
    var text = "";
    var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    console.log("Randomized unique PHPSESSID: " + text)

    return text;
}

// export only executable function
module.exports.sleep = sleep;
module.exports.writeJson = writeJson;
module.exports.randomizeID = randomizeID;

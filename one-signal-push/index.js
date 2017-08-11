var https = require('https');
var headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Authorization": "Basic XXXXXX"
};
var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers
};

exports.handler = function(event, context, callback){
    var pushType = event.body.push_type;
    var pushContent = event.body.pushContent;

    var message = {};
    message.app_id      = "XXXXXXXX";
    message.contents    = pushContent;
    message.type        = pushType;
    message.included_segments = ["All"];


    var req = https.request(options, function(res) {

        res.on('data', function(message) {

            console.log("Response:");
            console.log(JSON.parse(data));

            req.write(JSON.stringify(data));
        	req.end();

            callback(null,JSON.stringify({"result": "1"}));
        });
    });

    req.on('error', function(e) {

		console.log("ERROR:");
		console.log(e);

        req.write(JSON.stringify(data));
    	req.end();

        callback(null,JSON.stringify({"result": "-1"}));
	});
}

var db = require('../db');

exports.info = function(req, res) {
	db.provider.find({}, 'provider', function(err, result){
		if(!result) res.json({ status: 0, msg: 'No providers set.' });

		res.json({ providers: result });

	});
}

exports.sleep = function(req, res) {
	var filter = {},
		fields = '-_id -log';

	if(req.param('date')) {
		filter = { date: req.param('date') };
		fields = '-_id';
	}

	db.sleep.find(filter, fields, function(err, result) {
		if(!result) res.json({ status: 0, msg: 'No sleeps.' });

		res.json({ sleep: result });	
	});
}
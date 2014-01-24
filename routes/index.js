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
		if(req.param('date') == '1w') {
			filter = { date: { $gte: moment().subtract('days', 7).calendar(), $lte: moment().format('L') }};
		} else if(req.param('date') == '1m') {
			filter = { date: { $gte: moment().subtract('months', 1).calendar(), $lte: moment().format('L') }};
		} else {
			filter = { date: req.param('date') };
		}
		fields = '-_id';
	}

	db.sleep.find(filter, fields, function(err, result) {
		if(!result) res.json({ status: 0, msg: 'No sleeps.' });

		res.json({ sleep: result });	
	});
}
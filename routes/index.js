var db = require('../db');

exports.info = function(req, res) {
	db.provider.find({}, 'provider', function(err, result){
		if(!result) res.json({ status: 0, msg: 'No providers set.' });

		res.json({ providers: result });

	});
}
var	OAuth = require('oauth').OAuth,
	config = require('../config/app'),
	db = require('../db'),
	oauth = new OAuth(
		'https://www.fitbit.com/oauth/request_token',
		'https://api.fitbit.com/oauth/access_token',
		config.fitbit.CONSUMER_KEY,
		config.fitbit.CONSUMER_SECRET,
		'1.0',
		null,
		'HMAC-SHA1'
	);

module.exports.auth = function(req, res) {
	oauth.getOAuthRequestToken(function(err, oauth_token, oauth_token_secret, results) {
		if(err) {
			console.log('error: ');
			console.log(err);
		} else {
			req.session.oauth = oauth;
			req.session.oauth_token = oauth_token;
			req.session.oauth_token_secret = oauth_token_secret;
			res.redirect("https://www.fitbit.com/oauth/authorize?oauth_token="+oauth_token);
		}

	});
};

module.exports.access = function(req, res) {
	oauth.getOAuthAccessToken(
		req.session.oauth_token,
		req.session.oauth_token_secret,
		req.param('oauth_verifier'),
		function(err, oauth_access_token, oauth_access_token_secret, results) {
			if(err) {
				console.log('error: ');
				console.log(err);
			} else {
				req.session.oauth_access_token = oauth_access_token;
				req.session.oauth_access_token_secret = oauth_access_token_secret;

				_get(req, res, 'https://api.fitbit.com/1/user/-/profile.json', function(err, result) {
					if(err) res.json({error: 1});

					var fitbit_provider = {
						provider: 'fitbit',
						user_id: result.user.encodedId,
						oauth_access_token: req.session.oauth_access_token,
						oauth_access_token_secret: req.session.oauth_access_token_secret
					};

					db.provider.update({ provider: 'fitbit' }, fitbit_provider, { upsert: true }, function(err, result){
						if(err) res.json({ status: 0, error: err });
						res.json({ status: 1, result: 'true' });
					});
				});
			}
		}
	);
};

module.exports.user = function(req, res) {
	_get(req, res, 'https://api.fitbit.com/1/user/-/profile.json', function(err, result) {
		if(err) res.json({error: 1});
		res.json(result);
	});
};

module.exports.getActivities = function(req, res) {
	// check for date param otherwise set date for today
	var date = req.param('date') ? req.param('date') : yyyymmdd(new Date());

	_get(req, res, 'https://api.fitbit.com/1/user/-/activities/date/' + date + '.json', function(err, result){
		if(err) res.json({error: 1});
		result.date = date;
		res.json(result);
	});
}

module.exports.getSleep = function(req, res) {
	// check for date param otherwise set date for today
	var date = req.param('date') ? req.param('date') : yyyymmdd(new Date());

	_get(req, res, 'https://api.fitbit.com/1/user/-/sleep/date/' + date + '.json', function(err, result){
		if(err) res.json({error: 1});
		result.date = date;
		res.json(result);
	});
};

module.exports.isLoggedIn = function(req, res, next) {
	if(req.session.oauth_access_token && req.session.oauth_access_token_secret) {
		return next();
	} else {
		db.provider.findOne({ provider: 'fitbit' }, function(err, result){
			if(!result) res.json({ status: 0, msg: 'Fitbit not authenticated.' });

			req.session.oauth_access_token = result.oauth_access_token;
			req.session.oauth_access_token_secret = result.oauth_access_token_secret;
			
			return next();
		});
	}
}

var _get = function(req, res, url, callback) {
	oauth.get(
		url,
		req.session.oauth_access_token,
		req.session.oauth_access_token_secret,
		function(err, data, response) {
			if(err){
				console.log(err);
				callback(err, result);
			} else {
				var result = JSON.parse(data);
				callback(err, result);
			}
		}
	);
};

var yyyymmdd = function(date) {
	var yyyy = date.getFullYear().toString();
	var mm = (date.getMonth() + 1).toString();
	var dd = date.getDate().toString();

	return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]);
};
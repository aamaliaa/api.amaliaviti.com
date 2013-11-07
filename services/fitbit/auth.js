var	OAuth = require('oauth').OAuth,
	db = require('../../db'),
	oauth = new OAuth(
		'https://www.fitbit.com/oauth/request_token',
		'https://api.fitbit.com/oauth/access_token',
		process.env.FITBIT_CONSUMER_KEY,
		process.env.FITBIT_CONSUMER_SECRET,
		'1.0',
		null,
		'HMAC-SHA1'
	);

var baseURI = 'https://api.fitbit.com/1';


exports.rateOk = true; // false if rate limit is hit

var get = function(path, token, callback) {
	if(exports.rateOk){
		oauth.get(baseURI + path, token.token, token.token_secret, function(err, data, response) {
			if(err){
				if(err.statusCode == '409'){
					console.log('hit the rate limit');
					setRateTimer();
				}
				callback(err, data);
			} else {
				var result = JSON.parse(data);
				callback(err, result);
			}
		});
	} else{
		callback('hit rate limit', { status: 'bad', msg: 'hit the rate limit, you must wait.' });
	}
}

var setRateTimer = function(){
	// not ok to call API
	exports.rateOk = false;

	// will be ok in 1 hour
	setTimeout(function(){
		exports.rateOk = true;
	}, 3600000);
};

exports.get = get;

exports.auth = function(req, res) {
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

exports.access = function(req, res) {
	oauth.getOAuthAccessToken(
		req.session.oauth_token,
		req.session.oauth_token_secret,
		req.param('oauth_verifier'),
		function(err, token, token_secret, results) {
			if(err) {
				console.log('error: ');
				console.log(err);
			} else {
				var accessToken = {
					token: token,
					token_secret: token_secret
				};

				get('/user/-/profile.json', accessToken, function(err, result) {
					if(err) res.json({error: 1});

					var fitbit_provider = {
						provider: 'fitbit',
						user_id: result.user.encodedId,
						member_since: result.user.memberSince,
						token: {
							token: token,
							token_secret: token_secret
						}
					};

					db.provider.update({ provider: 'fitbit' }, fitbit_provider, { upsert: true }, function(err, result){
						if(err) res.json({ status: 0, error: err });
						res.json({ status: 1, result: result });
					});
				});

			}
		}
	);
};

exports.getProvider = function(callback) {
	db.provider.find({ provider: 'fitbit' }, function(err, result){
		if(err) console.log(err);
		callback(err, result[0]);
	});
}

exports.getToken = function(callback) {
	db.provider.find({ provider: 'fitbit' }, 'token', function(err, result){
		if(err) console.log(err);

		callback(err, result[0].token);
	});
};
var	fitbit = require('../services/fitbit/auth');

exports.fitbitAuth = function(req, res){
	fitbit.auth(req, res);
}

exports.fitbitAccess = function(req, res){
	fitbit.access(req, res);
}
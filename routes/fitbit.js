var fitbit = require('../services/fitbit/auth'),
	db = require('../db'),
	moment = require('moment');

exports.user = function(req, res) {
	fitbit.getToken(function(err, result){
		fitbit.get('/user/-/profile.json', result, function(err, data){
			res.json(data);
		});
	});
};

exports.populate = function(req, res) {

	console.log('started populating...');

	fitbit.getProvider(function(err, provider){

		// check for last date
		lastDate(function(entry){
			var token = provider.token,
				start_date = entry || moment(provider.member_since).utc().format('YYYY-MM-DD'),
				end_date = moment().format('YYYY-MM-DD'),
				current = start_date;

			popSleep(token, current, end_date);

		});

	});
}

var _show = function(err, result, req, res) {
	res.json(err || result);
}

var lastDate = function(callback) {
	db.sleep.findOne({}, 'date', { sort: { date: -1 } }, function(err, entry){
		// subtract 1 day bc overlapping means no lost data
		callback(moment(entry.date).subtract('days', 1).utc().format('YYYY-MM-DD'));
	});
}

var popSleep = function(token, current, end_date) {

	var path = '/user/-/sleep/date/' + current + '.json';

	// populate sleeps
	fitbit.get(path, token, function(err, result){
		if(err){
			console.log(err);
			console.log('stopped populating.');
		} else {
			var main = 0;
			
			for(i=0;i<result.sleep.length;i++){
				if(result.sleep[i].isMainSleep){
					var main = result.sleep[i];
				}
			}

			if(main){
				var sleep = {
					date: current,
					efficiency: main.efficiency,
					start_time: main.startTime,
					log: main.minuteData,
					totals: {
						min_to_asleep: main.minutesToFallAsleep,
						min_asleep: main.minutesAsleep,
						min_awake: main.minutesAwake,
						min_after_awake: main.minutesAfterWakeup,
						min_in_bed: main.timeInBed
					}
				};
			} else {
				var sleep = {
					date: current,
					log: [],
					totals: []
				};
			}

			db.sleep.update({ date: current }, sleep, { upsert: true }, function(err, result){
				if(err) {
					console.log(err);
				} else {
					console.log('\tsleep for '+ current +' successfully logged.');
					
					current = moment(current).add('days', 1).format('YYYY-MM-DD');

					if(current <= end_date){
						popSleep(token, current, end_date);
					} else {
						console.log('done populating.');
					}
				}
			});
		}
	});

}

var yyyymmdd = function(date) {
	var yyyy = date.getFullYear().toString();
	var mm = (date.getMonth() + 1).toString();
	var dd = date.getDate().toString();

	return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]);
};
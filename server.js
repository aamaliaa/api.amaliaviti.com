var express = require('express'),
	routes = require('./routes'),
	auth = require('./routes/auth'),
	fitbit = require('./routes/fitbit'),
	later = require('later'),
	app = express();

var env = process.env.NODE_ENV || 'dev',
	port = process.env.PORT || 8553;

app.configure(function () {
    app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
    app.use(express.cookieParser('lalafufu'));
	app.use(express.session());
});

// scheduled polling?
// var pollingSched = later.parse.text('every 15 min');
// var polling = later.setInterval(pollApis, pollingSched);

// function pollApis(){

// }

app.get('/', routes.info);

app.get('/fitbit/auth', auth.fitbitAuth);
app.get('/fitbit/callback', auth.fitbitAccess);

app.get('/fitbit/user', fitbit.user);

//app.get('/fitbit/getActivities/:date?', fitbit.getActivities);
//app.get('/fitbit/getSleep/:date?', fitbit.getSleep);

// CRONS @todo these should only run if provider is set
var sleepSched = later.parse.text('every 2 hours');
var sleep = later.setInterval(fitbit.populate, sleepSched);
fitbit.populate(); // run once on server start

app.listen(port, function(){
	console.log('Listening on port ' + port + '...');
});
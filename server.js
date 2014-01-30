var express = require('express'),
	routes = require('./routes'),
	auth = require('./routes/auth'),
	fitbit = require('./routes/fitbit'),
	later = require('later'),
	app = express();

Q = require('q');

var env = process.env.NODE_ENV || 'dev',
	port = process.env.PORT || 8553;

app.configure(function () {
	app.use(express.static(__dirname + '/public'));
	app.use(express.static(__dirname + '/bower_components'));
    app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
    app.use(express.cookieParser('lalafufu'));
	app.use(express.session());
});

app.get('/', function(req, res) {
	res.sendfile('./index.html');
});

app.get('/fitbit/auth', auth.fitbitAuth);
app.get('/fitbit/callback', auth.fitbitAccess);

app.get('/fitbit/user', fitbit.user);

app.get('/api/providers', routes.info);
app.get('/api/sleep/:date?', routes.sleep);

// CRONS @todo these should only run if provider is set
var sleepSched = later.parse.text('every 2 hours');
var sleep = later.setInterval(fitbit.populate, sleepSched);
fitbit.populate(); // run once on server start

app.listen(port, function(){
	console.log('Listening on port ' + port + '...');
});
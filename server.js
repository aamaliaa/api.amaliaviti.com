var express = require('express'),
	fitbit = require('./routes/fitbit'),
	later = require('later'),
	app = express();

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

app.get('/auth', fitbit.auth);
app.get('/callback', fitbit.access);

app.all('*', fitbit.isLoggedIn);
app.get('/user', fitbit.user);
app.get('/getActivities/:date?', fitbit.getActivities);
app.get('/getSleep/:date?', fitbit.getSleep);

app.listen(8553);

console.log('Listening on port 8553...');
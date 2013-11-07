var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/human_api", function(err){
	if(err) throw err;
	console.log('Successfully connected to MongoDB');
});

var	db = mongoose.connection,
	Schema = mongoose.Schema;

db.on('error', console.error.bind(console, 'connection error: '));

var providerSchema = Schema({
	provider: String,
	user_id: String,
	member_since: Date,
	token: {
		token: String,
		token_secret: String
	},
	synced_at: Date
});

var sleepSchema = Schema({
	date: Date,
	efficiency: Number,
	start_time: Date,
	log: [{ datetime: String, value: Number }],
	totals: {
		min_to_asleep: Number,
		min_asleep: Number,
		min_awake: Number,
		min_after_awake: Number,
		min_in_bed: Number
	}
});

var Provider = mongoose.model('Provider', providerSchema);
var Sleep = mongoose.model('Sleep', sleepSchema);

exports.provider = Provider;
exports.sleep = Sleep;
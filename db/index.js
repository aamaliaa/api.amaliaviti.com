var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/human_api");

var	db = mongoose.connection,
	Schema = mongoose.Schema;

db.on('error', console.error.bind(console, 'connection error: '));

var providerSchema = Schema({
	provider: String,
	user_id: String,
	oauth_access_token: String,
	oauth_access_token_secret: String,
	synced_at: Date
});

var Provider = mongoose.model('Provider', providerSchema);

exports.provider = Provider;
var mongoose  = require('mongoose');
var Schema = mongoose.Schema;

var BarSchema  = new Schema({
    location: String,
    name: String,
    img: String,
    snippet: String,
    visitors: Number
});

module.exports = mongoose.model('Bar', BarSchema);

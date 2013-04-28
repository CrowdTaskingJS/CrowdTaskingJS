var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

if (!this.db) {
  this.db = mongoose.connect(process.env.MONGOHQ_URL || 'mongodb://localhost/crowdtesting_test');
}

var ResearchSchema = new Schema({
  title: {type: String, unique: true},
  url: String,
  state: Schema.Types.Mixed
});


/**
 * Models
 */

mongoose.model('Research', ResearchSchema);
exports.Research = function() { return this.db.model('Research') };
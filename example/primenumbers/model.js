var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

if (!this.db) {
  this.db = mongoose.connect(process.env.MONGOHQ_URL || 'mongodb://localhost/crowdtesting_test1');
}

var ResearchSchema = new Schema({
  title: {type: String, unique: true},
  description: String,
  url: String,
  state: Schema.Types.Mixed
});


/**
 * Models
 */

mongoose.model('Research', ResearchSchema);
exports.Research = function() { return this.db.model('Research') };
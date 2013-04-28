var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

if (!this.db) {
  this.db = mongoose.connect(process.env.MONGOHQ_URL || 'mongodb://localhost/crowdtesting_test2');
}

var ResearchSchema = new Schema({
  title: {type: String, unique: true},
  description: String,
  path: {type: String, unique: true},
  state: Schema.Types.Mixed
});


/**
 * Models
 */

mongoose.model('Research', ResearchSchema);
exports.Research = function() { return this.db.model('Research') };
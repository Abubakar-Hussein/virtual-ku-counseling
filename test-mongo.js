const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/ku-counseling');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
  try {
    const cp = db.collection('counselorprofiles');
    // dummy test for aggregation pipeline in update
    await cp.findOneAndUpdate(
      { test: true },
      [
        { $set: { _newCount: 1 } }
      ],
      { upsert: true }
    );
    console.log('Update pipeline success!');
  } catch (err) {
    console.error('Update pipeline error:', err.message);
  } finally {
    mongoose.connection.close();
  }
});

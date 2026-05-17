const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/ku-counseling');

const CounselorProfileSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        averageRating: { type: Number, default: 0 },
        totalRatings: { type: Number, default: 0 },
    }
);

const CounselorProfile = mongoose.model('CounselorProfile', CounselorProfileSchema);

const db = mongoose.connection;
db.once('open', async function() {
  try {
    const userId = new mongoose.Types.ObjectId();
    const rating = 5;
    
    await CounselorProfile.findOneAndUpdate(
        { userId: userId },
        [
            {
                $set: {
                    _newCount: { $add: [{ $ifNull: ['$totalRatings', 0] }, 1] },
                    _newAvg: {
                        $round: [
                            {
                                $divide: [
                                    {
                                        $add: [
                                            {
                                                $multiply: [
                                                    { $ifNull: ['$averageRating', 0] },
                                                    { $ifNull: ['$totalRatings', 0] },
                                                ],
                                            },
                                            rating,
                                        ],
                                    },
                                    { $add: [{ $ifNull: ['$totalRatings', 0] }, 1] },
                                ],
                            },
                            1,
                        ],
                    },
                },
            },
            {
                $set: {
                    totalRatings: '$_newCount',
                    averageRating: '$_newAvg',
                },
            },
            {
                $unset: ['_newCount', '_newAvg'],
            },
        ],
        { upsert: true, new: true }
    );
    console.log('Mongoose Pipeline Update Success!');
  } catch (err) {
    console.error('Mongoose Pipeline Update error:', err.message);
  } finally {
    mongoose.connection.close();
  }
});

const mongoose = require('mongoose');
const dbUrl = process.env.NODE_ENV === 'production' ? process.env.DB_URL : process.env.DB_URL_DEV
const connectDB = async () => {
  await mongoose.connect(dbUrl, {
    useUnifiedTopology: true,
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: true,
  });
  console.log('Connected to MongoDB :)')
};

module.exports = connectDB

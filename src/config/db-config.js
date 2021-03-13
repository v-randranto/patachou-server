const mongoose = require('mongoose');
const connectDB = async () => {
  await mongoose.connect(process.env.DB_URL, {
    useUnifiedTopology: true,
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: true,
  });
  console.log('Connected to MongoDB :)')
};

module.exports = connectDB

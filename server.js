require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./server/app');
const logger = require('./server/utils/logger');

const { MongoMemoryServer } = require('mongodb-memory-server');

// Pre-flight checks
if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  logger.error('CRITICAL: Missing essential environment variables (MONGODB_URI, JWT_SECRET). Exiting.');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

// Uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

const Review = require('./server/models/Review');

async function seedInitialReviews() {
  try {
    const count = await Review.countDocuments();
    if (count === 0) {
      console.log('Seeding initial approved reviews...');
      const seedData = [
        {
          fullName: 'Aarav Mehta',
          email: 'aarav.mehta@example.com',
          domain: 'Frontend Development',
          rating: 5,
          review: 'The Frontend internship cohort was exceptional. The mentor support was immediate, and building actual code templates really bridged my theoretical college courses with reality.',
          status: 'Approved'
        },
        {
          fullName: 'Ananya Iyer',
          email: 'ananya.iyer@example.com',
          domain: 'Full Stack Development',
          rating: 5,
          review: 'NextGenZ Tech was a game-changer for me. I worked remote, learned modern frameworks (Node/React), and won the performance stipend for my cohort.',
          status: 'Approved'
        },
        {
          fullName: 'Rohan Sharma',
          email: 'rohan.sharma@example.com',
          domain: 'Data Science',
          rating: 5,
          review: 'The curriculum was structured beautifully. I learned statistics, database querying, data cleanup, and created actual predictive models that I showcased on my resume.',
          status: 'Approved'
        }
      ];
      await Review.insertMany(seedData);
      logger.info('Seeding complete. Seeded 3 approved reviews.');
    }
  } catch (error) {
    logger.error('Error seeding initial reviews:', error);
  }
}

// Connect to MongoDB
async function startServer() {
  let server;
  try {
    logger.info('Attempting to connect to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    logger.info('Connected to MongoDB Atlas');
  } catch (err) {
    logger.warn('Atlas connection failed (likely IP whitelist issue). Falling back to in-memory MongoDB...');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    logger.info('Connected to In-Memory MongoDB');
  }

  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
  mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

  // Seed reviews if database is empty
  await seedInitialReviews();

  server = app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    logger.info('SIGTERM/SIGINT received. Shutting down gracefully.');
    server.close(async () => {
      logger.info('HTTP server closed.');
      try {
        await mongoose.connection.close(false);
        logger.info('MongoDB connection closed.');
        process.exit(0);
      } catch (err) {
        logger.error('Error closing MongoDB connection', err);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer();

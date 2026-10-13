require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set. Copy .env.example → .env and fill it in.');
  process.exit(1);
}

const User = require('../src/models/User');
const Task = require('../src/models/Task');

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const adminPassword = await bcrypt.hash('Admin@1234', 10);
  const admin = await User.findOneAndUpdate(
    { email: 'admin@example.com' },
    { $set: { password: adminPassword, role: 'ADMIN' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const userPassword = await bcrypt.hash('User@1234', 10);
  const user = await User.findOneAndUpdate(
    { email: 'user@example.com' },
    { $set: { password: userPassword, role: 'USER' } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const existingCount = await Task.countDocuments({ userId: user._id });
  if (existingCount === 0) {
    await Task.insertMany([
      {
        title: 'Learn Mongoose',
        description: 'Set up Mongoose with MongoDB, understand schemas and models',
        status: 'DONE',
        priority: 'HIGH',
        userId: user._id,
      },
      {
        title: 'Implement JWT auth',
        description: 'Access + refresh token flow with bcrypt password hashing',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        userId: user._id,
      },
      {
        title: 'Write integration tests',
        description: 'Test all auth and task endpoints end-to-end',
        status: 'TODO',
        priority: 'MEDIUM',
        userId: user._id,
      },
    ]);
    console.log('Seeded 3 sample tasks');
  } else {
    console.log(`Skipped task seed — user already has ${existingCount} task(s)`);
  }

  console.log(`\nSeeded accounts:`);
  console.log(`  Admin: ${admin.email}  password: Admin@1234`);
  console.log(`  User:  ${user.email}   password: User@1234`);
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());

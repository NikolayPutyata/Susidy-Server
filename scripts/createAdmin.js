import 'dotenv/config';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { UsersCollection } from '../src/db/models/user.js';
import { getEnvVar } from '../src/utils/getEnvVar.js';

const run = async () => {
  const name = getEnvVar('ADMIN_NAME', 'Admin');
  const phoneNumber = getEnvVar('ADMIN_PHONE');
  const email = getEnvVar('ADMIN_EMAIL');
  const password = getEnvVar('ADMIN_PASSWORD');

  await mongoose.connect(getEnvVar('MONGODB_URI'));

  const encryptedPassword = await bcrypt.hash(password, 10);

  const admin = await UsersCollection.findOneAndUpdate(
    { $or: [{ email }, { phoneNumber }] },
    {
      $set: {
        name,
        phoneNumber,
        email,
        password: encryptedPassword,
        role: 'admin',
      },
    },
    { upsert: true, new: true },
  );

  console.log(`Admin ready: ${admin.email} (${admin._id})`);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Failed to seed admin user', err);
  process.exit(1);
});

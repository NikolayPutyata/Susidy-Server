import mongoose, { Schema } from 'mongoose';

// A separate, reserve MongoDB (its own BACKUP_MONGODB_URI, not the main
// database) holding only name + phone of everyone who ordered or
// registered — a minimal contact list that survives anything happening
// to the main DB. One record per phone: the first name seen is kept,
// repeats are ignored. Leave BACKUP_MONGODB_URI blank to turn it off.
const backupContactSchema = new Schema(
  {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
  },
  // Short buffer timeout: this runs while the customer waits for their
  // order confirmation, so an unreachable backup DB must fail fast.
  { versionKey: false, bufferTimeoutMS: 5000 },
);

let BackupContacts = null;

const getBackupContacts = () => {
  const uri = process.env.BACKUP_MONGODB_URI;
  if (!uri) return null;
  if (!BackupContacts) {
    const connection = mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    connection.on('error', (err) =>
      console.error('Backup MongoDB connection error', err),
    );
    BackupContacts = connection.model('contacts', backupContactSchema);
  }
  return BackupContacts;
};

export const saveBackupContact = async ({ name, phoneNumber }) => {
  const collection = getBackupContacts();
  if (!collection || !name || !phoneNumber) return;

  try {
    await collection.updateOne(
      { phoneNumber },
      { $setOnInsert: { name, phoneNumber } },
      { upsert: true },
    );
  } catch (err) {
    // Two simultaneous orders from a new number can both try to insert —
    // the unique index rejects the second, which is exactly "already there".
    if (err?.code === 11000) return;
    throw err;
  }
};

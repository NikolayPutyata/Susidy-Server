import { model, Schema } from 'mongoose';

// One pending SMS code per phone + purpose — a resend replaces it. Stored
// hashed; MongoDB's TTL index drops it on its own once expiresAt passes.
const smsCodeSchema = new Schema(
  {
    phoneNumber: { type: String, required: true },
    purpose: { type: String, enum: ['register', 'reset'], required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);

smsCodeSchema.index({ phoneNumber: 1, purpose: 1 }, { unique: true });
smsCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const SmsCodesCollection = model('smsCodes', smsCodeSchema);

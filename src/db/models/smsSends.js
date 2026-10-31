import { model, Schema } from 'mongoose';

// A log of every SMS actually sent, kept for 24h — the rate limits in
// services/sms.js count these (per phone, per IP, and in total), so they
// hold across server restarts and multiple instances.
const smsSendSchema = new Schema(
  {
    phoneNumber: { type: String, required: true },
    ip: { type: String },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 },
  },
  { versionKey: false },
);

smsSendSchema.index({ phoneNumber: 1, createdAt: -1 });
smsSendSchema.index({ ip: 1, createdAt: -1 });

export const SmsSendsCollection = model('smsSends', smsSendSchema);

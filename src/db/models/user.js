import { model, Schema } from 'mongoose';

const usersSchema = new Schema(
  {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String },
    city: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    // Settable once at the user's own choice; service layer rejects any
    // further change once this is non-null.
    birthday: { type: Date, default: null },
    favorites: { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false },
);

usersSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const UsersCollection = model('users', usersSchema);

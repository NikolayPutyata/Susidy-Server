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
    // Up to MAX_SAVED_ADDRESSES (see services/users.js) — enforced in the
    // service, not here, so the error message stays in one place. Each
    // gets its own _id (standard Mongoose subdocument behavior) so the
    // client can reference one for delete/set-default.
    savedAddresses: {
      type: [
        {
          city: { type: String, enum: ['kyiv', 'kharkiv'], required: true },
          street: { type: String, required: true },
          building: { type: String },
          apartment: { type: String },
          entrance: { type: String },
          floor: { type: String },
          isPrivateHouse: { type: Boolean, default: false },
          lat: { type: Number },
          lng: { type: Number },
          formattedAddress: { type: String },
          isDefault: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
  },
  { timestamps: true, versionKey: false },
);

usersSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const UsersCollection = model('users', usersSchema);

import { model, Schema } from 'mongoose';

const orderSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    city: { type: String, enum: ['kyiv', 'kharkiv'], required: true },
    fulfillment: {
      type: String,
      enum: ['pickup', 'delivery'],
      default: 'delivery',
    },
    street: { type: String },
    building: { type: String },
    apartment: { type: String },
    isPrivateHouse: { type: Boolean, default: false },
    cutlery: { type: Number, default: 1 },
    details: { type: String },
    noCallback: { type: Boolean, default: false },
    paymentMethod: {
      type: String,
      enum: ['cod', 'online'],
      default: 'cod',
    },
    items: [
      {
        product_id: String,
        productName: String,
        quantity: Number,
        price: Number,
        image: String,
        _id: false,
      },
    ],
    total: Number,
  },
  { timestamps: true, versionKey: false },
);

orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export const OrdersCollection = model('orders', orderSchema);

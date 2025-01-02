import { model, Schema } from 'mongoose';

const orderSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId },
    session_id: { type: String },
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    delivery: { type: String },
    details: { type: String },
    items: [
      {
        product_id: String,
        productName: String,
        quantity: Number,
        price: Number,
      },
    ],
    total: Number,
  },
  { timestamps: true, versionKey: false },
);

orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export const OrdersCollection = model('orders', orderSchema);

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
    entrance: { type: String },
    floor: { type: String },
    isPrivateHouse: { type: Boolean, default: false },
    pickupAddress: { type: String },
    pickupPointId: { type: String },
    // Set for delivery orders once the customer picks an address via
    // autocomplete or the map — used server-side to compute pickupPointId
    // (which point prepares it), and kept on the order for reference.
    deliveryLocation: {
      lat: { type: Number },
      lng: { type: Number },
      _id: false,
    },
    requestedTime: { type: String },
    cutlery: { type: Number, default: 1 },
    details: { type: String },
    noCallback: { type: Boolean, default: false },
    paymentMethod: {
      type: String,
      enum: ['cod', 'online'],
      default: 'cod',
    },
    // The amount the customer says they'll pay with in cash, so staff can
    // prepare change — only meaningful for paymentMethod 'cod', set when
    // the customer filled in the "Підготувати решту з суми" field.
    cashAmount: { type: Number },
    items: [
      {
        product_id: String,
        productName: String,
        quantity: Number,
        price: Number,
        image: String,
        weight: Number,
        addonType: { type: String, enum: ['sauce', 'ginger', 'wasabi'], default: null },
        category: String,
        freeQuantity: { type: Number, default: 0 },
        _id: false,
      },
    ],
    // Flat 150 UAH, or 0 for pickup / once main-item total reaches the
    // free-delivery threshold — see services/cart.js::createOrder.
    deliveryFee: { type: Number, default: 0 },
    total: Number,
  },
  { timestamps: true, versionKey: false },
);

orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export const OrdersCollection = model('orders', orderSchema);

import { model, Schema } from 'mongoose';

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    priceKiev: { type: Number, required: true },
    priceKharkov: { type: Number, required: true },
    category: {
      type: String,
      enum: [
        'rolls',
        'sushi',
        'hotRolls',
        'hunkans',
        'sets',
        'drinks',
        'maki',
        'bigRolls',
        'other',
      ],
      default: 'other',
      required: true,
    },
    images: { type: [String], required: true },
    description: { type: String },
    weight: { type: Number },
    // Pickup point IDs where this item is currently "put on stop" by an
    // admin — availability elsewhere (other points, delivery) is
    // unaffected.
    stoppedPoints: { type: [String], default: [] },
  },
  { timestamps: true, versionKey: false },
);

export const ProductsCollection = model('products', productSchema);

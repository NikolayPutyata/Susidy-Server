import { model, Schema } from 'mongoose';

// The big autoplay promo carousel on the homepage ("новини, зміни, акції") —
// pure marketing content, managed by the admin, nothing else in the app
// reads or depends on it.
const bannerSchema = new Schema(
  {
    image: { type: String, required: true },
    title: { type: String },
    subtitle: { type: String },
    // Optional click target — a relative in-app path (e.g. /?category=sets)
    // or a full external URL; left empty, the slide just isn't clickable.
    link: { type: String },
    // Manually set by the admin, same pattern as featuredOrder on
    // products — lower sorts first. No drag-and-drop reordering UI.
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

export const BannersCollection = model('banners', bannerSchema);

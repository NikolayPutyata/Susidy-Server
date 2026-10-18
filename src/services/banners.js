import createHttpError from 'http-errors';
import { BannersCollection } from '../db/models/banners.js';

export const getActiveBanners = async () => {
  return await BannersCollection.find({ active: true }).sort({ order: 1 });
};

export const getAllBanners = async () => {
  return await BannersCollection.find().sort({ order: 1 });
};

export const createBanner = async (payload) => {
  return await BannersCollection.create(payload);
};

export const updateBanner = async (bannerId, payload) => {
  const banner = await BannersCollection.findByIdAndUpdate(bannerId, payload, {
    new: true,
  });

  if (!banner) {
    throw createHttpError(404, 'Banner not found');
  }

  return banner;
};

export const deleteBanner = async (bannerId) => {
  const banner = await BannersCollection.findByIdAndDelete(bannerId);

  if (!banner) {
    throw createHttpError(404, 'Banner not found');
  }

  return banner;
};

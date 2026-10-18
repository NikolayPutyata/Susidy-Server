import createHttpError from 'http-errors';
import {
  createBanner,
  deleteBanner,
  getActiveBanners,
  getAllBanners,
  updateBanner,
} from '../services/banners.js';
import { uploadImages } from '../utils/cloudinary.js';

export const getActiveBannersController = async (req, res) => {
  const banners = await getActiveBanners();

  res.status(200).json({ status: 200, data: banners });
};

export const getAllBannersController = async (req, res) => {
  const banners = await getAllBanners();

  res.status(200).json({ status: 200, data: banners });
};

export const createBannerController = async (req, res) => {
  if (!req.file) {
    throw createHttpError(400, 'A banner image is required');
  }

  const [image] = await uploadImages([req.file]);

  const banner = await createBanner({ ...req.body, image });

  res.status(201).json({ status: 201, data: banner });
};

export const updateBannerController = async (req, res) => {
  const { id } = req.params;

  const payload = { ...req.body };
  if (req.file) {
    const [image] = await uploadImages([req.file]);
    payload.image = image;
  }

  const banner = await updateBanner(id, payload);

  res.status(200).json({ status: 200, data: banner });
};

export const deleteBannerController = async (req, res) => {
  const { id } = req.params;
  await deleteBanner(id);

  res.status(204).send();
};

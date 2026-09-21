import mongoose from 'mongoose';

import { getEnvVar } from '../utils/getEnvVar.js';

export const initMongoDB = async () => {
  try {
    await mongoose.connect(getEnvVar('MONGODB_URI'));
    console.log('Mongo connection successfully established!');
  } catch (e) {
    console.log('Error while setting up mongo connection', e);
    throw e;
  }
};

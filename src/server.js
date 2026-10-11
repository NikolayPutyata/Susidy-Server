import express from 'express';
import pino from 'pino-http';
import cors from 'cors';
import { getEnvVar } from './utils/getEnvVar.js';
import mainRouter from './routers/index.js';
import { notFoundMiddleware } from './middlewares/notFoundMiddleware.js';
import { errorMiddleware } from './middlewares/errorMiddleware.js';
import cookieParser from 'cookie-parser';

const PORT = Number(getEnvVar('PORT', '3000'));
const allowedOrigins = getEnvVar('CLIENT_ORIGIN', '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const startServer = () => {
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: allowedOrigins.length > 0 ? allowedOrigins : true,
      credentials: true,
    }),
  );
  app.use(cookieParser());

  // pino-pretty is a devDependency — colorized formatting is only useful
  // while watching logs locally. A production install skips devDependencies
  // (npm install --omit=dev), so pointing at it unconditionally crashes the
  // whole process on boot once deployed. Plain JSON logs in production are
  // also what you actually want there (parseable by log aggregators).
  app.use(
    pino(
      process.env.NODE_ENV === 'production'
        ? {}
        : { transport: { target: 'pino-pretty' } },
    ),
  );

  app.use(mainRouter);

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

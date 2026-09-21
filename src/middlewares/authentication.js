import createHttpError from 'http-errors';
import { SessionsCollection } from '../db/models/sessions.js';
import { UsersCollection } from '../db/models/user.js';

const resolveUser = async (req) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) return null;

  const [bearer, token] = authHeader.split(' ');
  if (bearer !== 'Bearer' || !token) {
    throw createHttpError(401, 'Auth header should be of type Bearer');
  }

  const session = await SessionsCollection.findOne({ accessToken: token });
  if (!session) {
    throw createHttpError(401, 'Session not found');
  }

  if (new Date() > new Date(session.accessTokenValidUntil)) {
    throw createHttpError(401, 'Access token expired');
  }

  const user = await UsersCollection.findById(session.userId);
  if (!user) {
    throw createHttpError(401, 'User not found');
  }

  return user;
};

export const authentication = async (req, res, next) => {
  try {
    req.user = await resolveUser(req);
    next();
  } catch (err) {
    next(err);
  }
};

export const requireAuth = async (req, res, next) => {
  try {
    const user = await resolveUser(req);
    if (!user) {
      throw createHttpError(401, 'Authorization header is required');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(createHttpError(403, 'Admin access required'));
  }

  next();
};

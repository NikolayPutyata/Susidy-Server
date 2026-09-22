import { ONE_MONTH } from '../constants/index.js';
import {
  loginUser,
  logoutUser,
  refreshUsersSession,
  registerUser,
} from '../services/auth.js';
import { getSessionCookieOptions } from '../utils/cookies.js';

export const registerUserController = async (req, res) => {
  const reqData = {
    name: req.body.name,
    phoneNumber: req.body.phoneNumber,
    password: req.body.password,
    city: req.body.city,
  };

  const user = await registerUser(reqData);

  res.status(201).json({ status: 201, data: user });
};

export const loginUserController = async (req, res) => {
  const reqData = {
    phoneNumber: req.body.phoneNumber,
    password: req.body.password,
  };

  const session = await loginUser(reqData);

  res.cookie('refreshToken', session.refreshToken, {
    ...getSessionCookieOptions(),
    expires: new Date(Date.now() + ONE_MONTH),
  });
  res.cookie('sessionId', session._id, {
    ...getSessionCookieOptions(),
    expires: new Date(Date.now() + ONE_MONTH),
  });

  res.json({
    status: 200,
    message: 'Successfully logged',
    data: {
      accessToken: session.accessToken,
    },
  });
};

export const logoutUserController = async (req, res) => {
  if (req.cookies.sessionId) {
    await logoutUser(req.cookies.sessionId);
  }

  res.clearCookie('sessionId', getSessionCookieOptions());
  res.clearCookie('refreshToken', getSessionCookieOptions());

  res.status(204).send();
};

const setupSession = (res, session) => {
  res.cookie('refreshToken', session.refreshToken, {
    ...getSessionCookieOptions(),
    expires: new Date(Date.now() + ONE_MONTH),
  });
  res.cookie('sessionId', session._id, {
    ...getSessionCookieOptions(),
    expires: new Date(Date.now() + ONE_MONTH),
  });
};

export const refreshUserSessionController = async (req, res) => {
  const session = await refreshUsersSession({
    sessionId: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });

  setupSession(res, session);

  res.json({
    status: 200,
    message: 'Successfully refreshed',
    data: {
      accessToken: session.accessToken,
    },
  });
};

export const getMeController = async (req, res) => {
  res.json({ status: 200, data: req.user });
};

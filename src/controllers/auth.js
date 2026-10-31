import { SESSION_DURATION } from '../constants/index.js';
import {
  loginUser,
  logoutUser,
  refreshUsersSession,
  registerUser,
  resetPassword,
} from '../services/auth.js';
import { requestSmsCode } from '../services/sms.js';
import { getSessionCookieOptions } from '../utils/cookies.js';

export const registerUserController = async (req, res) => {
  const reqData = {
    name: req.body.name,
    phoneNumber: req.body.phoneNumber,
    password: req.body.password,
    city: req.body.city,
    code: req.body.code,
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
    expires: new Date(Date.now() + SESSION_DURATION),
  });
  res.cookie('sessionId', session._id, {
    ...getSessionCookieOptions(),
    expires: new Date(Date.now() + SESSION_DURATION),
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
    expires: new Date(Date.now() + SESSION_DURATION),
  });
  res.cookie('sessionId', session._id, {
    ...getSessionCookieOptions(),
    expires: new Date(Date.now() + SESSION_DURATION),
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

export const requestSmsCodeController = async (req, res) => {
  const data = await requestSmsCode({
    phoneNumber: req.body.phoneNumber,
    purpose: req.body.purpose,
    ip: req.ip,
  });

  res.status(200).json({ status: 200, data });
};

export const resetPasswordController = async (req, res) => {
  await resetPassword({
    phoneNumber: req.body.phoneNumber,
    code: req.body.code,
    password: req.body.password,
  });

  res.status(200).json({ status: 200, message: 'Password updated' });
};

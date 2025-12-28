const User = require('../models/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
    user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;

    if (!username || !email || !password) {
    return next(new AppError('Please provide username, email, and password', 400));
  }

    if (!validator.isEmail(email)) {
    return next(new AppError('Please provide a valid email', 400));
  }

    const existingUserByEmail = await User.findOne({ email });
  if (existingUserByEmail) {
    return next(new AppError('User already exists with this email', 400));
  }

  const existingUserByUsername = await User.findOne({ username: username.trim() });
  if (existingUserByUsername) {
    return next(new AppError('Username already taken', 400));
  }

    const newUser = await User.create({
    username: username.trim(),
    email: email.toLowerCase().trim(),
    password,
  });

    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

    if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

    const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

    createSendToken(user, 200, res);
});

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

exports.protect = catchAsync(async (req, res, next) => {
    let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

    req.user = currentUser;
  next();
});

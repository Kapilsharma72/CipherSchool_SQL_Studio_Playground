require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');

const { connectMongoDB, testPgConnection } = require('./config/db');
const globalErrorHandler = require('./utils/errorHandler');
const AppError = require('./utils/appError');
const queryRoutes = require('./routes/queryRoutes');
const authRoutes = require('./routes/authRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const learningAssistantRoutes = require('./routes/learningAssistantRoutes');

const app = express();

app.use(helmet());

const corsOptions = {
  origin: 'http:  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

const upload = multer();
app.use(upload.none()); 
const limiter = rateLimit({
  max: process.env.NODE_ENV === 'development'
    ? 1000
    : parseInt(process.env.RATE_LIMIT_MAX) || 100,
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use((req, res, next) => {
  if (req.path === '/api/health') {
    return next();
  }
  limiter(req, res, next);
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/v1/query', queryRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/learning-assistant', learningAssistantRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

const startServer = async () => {
  try {
    await testPgConnection();
    await connectMongoDB();

    const PORT = process.env.PORT || 5001;
    const server = app.listen(PORT, () => {
      console.log(` Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

        process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION!  Shutting down...');
      console.error(err.name, err.message);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

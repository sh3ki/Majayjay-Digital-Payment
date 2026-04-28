import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { env } from './config/env';
import { logger } from './utils/logger';
import { generalLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler, notFound } from './middlewares/errorHandler.middleware';
import routes from './routes/index';

const app = express();
const httpServer = createServer(app);

// Socket.IO for real-time updates
export const io = new SocketIOServer(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Security & Middleware
app.use(helmet());
app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));
app.use(generalLimiter);

// Routes
app.use('/api/v1', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start
const PORT = env.PORT;
httpServer.listen(PORT, () => {
  logger.info(`🚀 Majayjay Digital Payment System backend running on port ${PORT}`);
  logger.info(`📚 API: http://localhost:${PORT}/api/v1`);
  logger.info(`🌱 Environment: ${env.NODE_ENV}`);
});

export default app;

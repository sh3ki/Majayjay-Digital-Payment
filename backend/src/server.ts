import 'dotenv/config';
import express, { Request } from 'express';
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
import { handlePaymongoWebhook } from './controllers/paymongo.controller';
import { startOverdueJob } from './jobs/overdue.job';

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
  origin: env.NODE_ENV === 'production'
    ? [env.FRONTEND_URL]
    : [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Raw body capture for PayMongo webhook signature verification (must be BEFORE express.json)
app.use('/api/v1/webhooks/paymongo', express.raw({ type: 'application/json' }), (req: Request & { rawBody?: string }, _res, next) => {
  req.rawBody = (req.body as Buffer).toString('utf8');
  next();
});

// PayMongo webhook (raw body parsed above, event handled directly)
app.post('/api/v1/webhooks/paymongo', handlePaymongoWebhook);

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
  startOverdueJob();
});

export default app;

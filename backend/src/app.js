import cors from 'cors';
import express from 'express';

import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import buyerRoutes from './routes/buyerRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import farmerRoutes from './routes/farmerRoutes.js';
import logisticsRoutes from './routes/logisticsRoutes.js';

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_request, response) => {
  response.status(200).json({
    status: 'ok',
    service: 'AgriLink API',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/buyers', buyerRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/logistics', logisticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

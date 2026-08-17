import 'dotenv/config';

import app from './app.js';
import connectDatabase from './config/database.js';

const port = Number(process.env.PORT) || 5001;

async function startServer() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    await connectDatabase();

    app.listen(port, () => {
      console.log(`AgriLink API listening on port ${port}`);
    });
  } catch (error) {
    console.error('Unable to start AgriLink API:', error.message);
    process.exit(1);
  }
}

startServer();

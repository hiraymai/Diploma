import Stripe from 'stripe';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';

const stripe = new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
});

logger.info('✅ Stripe initialized');

export default stripe;

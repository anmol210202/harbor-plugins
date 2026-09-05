import Fastify from 'fastify';
import cors from '@fastify/cors';
import { bookRoutes } from './routes/book.js';

const server = Fastify({
  logger: true,
});

// Enable CORS for all origins (required for Harbor webviews and mobile apps)
await server.register(cors, {
  origin: true,
  methods: ['GET', 'HEAD', 'OPTIONS'],
});

// Health check
server.get('/health', async () => {
  return {
    status: 'ok',
    service: 'harbor-book-proxy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
});

// Register book routes
await server.register(bookRoutes);

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

try {
  const address = await server.listen({ port: PORT, host: HOST });
  console.log(`🚀 Harbor Book Proxy Server running at ${address}`);
  console.log(`📖 Ready to stream published books and web novels directly to Harbor!`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}

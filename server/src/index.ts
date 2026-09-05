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

// Diagnostic route to inspect upstream response
server.get<{ Querystring: { url?: string } }>('/api/v1/test', async (req) => {
  const target = req.query.url || 'https://libgen.vg/index.php?req=fiction';
  try {
    const res = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      },
    });
    const text = await res.text();
    return {
      target,
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      bodyPreview: text.slice(0, 1000),
    };
  } catch (err: any) {
    return { target, error: err.message };
  }
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

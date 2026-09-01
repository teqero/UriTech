import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

const logger = new Logger('Bootstrap');

function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  const isProd = process.env.NODE_ENV === 'production';

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: isProd
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hidePoweredBy: true,
    frameguard: { action: 'deny' },
    dnsPrefetchControl: { allow: false },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    xssFilter: true,
  }));

  // Body parsers with limits
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // Request ID middleware
  app.use((req: any, _res: any, next: any) => {
    req.requestId = req.headers['x-request-id'] || generateRequestId();
    next();
  });

  // CORS — strict in production, permissive in dev
  const allowedOrigins = isProd
    ? (process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) ?? [])
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8081',
        'http://localhost:8082',
        'http://localhost:8083',
        'http://localhost:8084',
        'http://localhost:8086',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:8084',
        'exp://localhost:8084',
      ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!isProd) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86400,
  });

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger/OpenAPI — disponível em todos os ambientes
  const swaggerConfig = new DocumentBuilder()
    .setTitle('UriTech API')
    .setDescription('API da plataforma UriTech — motorista, lojista, consumidor e serviços on-demand')
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .addTag('Auth', 'Autenticação e autorização')
    .addTag('KYC', 'Know Your Customer — verificação de identidade')
    .addTag('Wallet', 'Carteira digital — saldo, carregamento, transferências')
    .addTag('Orders', 'Pedidos e checkout')
    .addTag('Rides', 'Viagens e motoristas')
    .addTag('Drivers', 'Gestão de motoristas')
    .addTag('Vendors', 'Gestão de lojistas')
    .addTag('Notifications', 'Push, SMS e email')
    .addTag('Services', 'Catálogo de serviços e health check')
    .addTag('Claim Evidence', 'Reclamações e provas')
    .addTag('Insurers', 'Seguradoras e sinistros')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'UriTech API Docs',
  });

  const port = process.env.PORT || 4000;

  // Graceful shutdown hooks
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`UriTech API running on http://localhost:${port}/api/v1 (${isProd ? 'production' : 'development'})`);
  logger.log(`Swagger UI available at http://localhost:${port}/api/docs`);
}

// Graceful shutdown — SIGTERM/SIGINT
process.on('SIGTERM', async () => {
  logger.log('SIGTERM recebido, a iniciar shutdown gracioso...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.log('SIGINT recebido, a iniciar shutdown gracioso...');
  process.exit(0);
});

bootstrap();

import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './common/jwt-auth/jwt-auth.guard';
import helmet from 'helmet';
import * as fs from 'fs';
import * as path from 'path';


async function bootstrap() {
  let app;
  try {
    const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, '../..', 'ssl', 'key.pem');
    const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, '../..', 'ssl', 'cert.pem');
    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      app = await NestFactory.create(AppModule, {
        httpsOptions: {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        },
      });
    } else {
      app = await NestFactory.create(AppModule);
    }
  } catch {
    app = await NestFactory.create(AppModule);
  }
  app.use(helmet());
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['*'];
  app.enableCors({ origin: allowedOrigins, credentials: true });
  app.useGlobalGuards(new JwtAuthGuard());

  const config = new DocumentBuilder()
    .setTitle('Sanatio Billing Service')
    .setDescription('APIs pour la facturation et les paiements')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();

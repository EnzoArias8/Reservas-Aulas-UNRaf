import { Application } from 'express';

declare module 'express-serve-static-core' {
  interface Application {
    setupLogging(): void;
    setupBodyParser(): void;
    setupRoutes(): void;
    setupAuth(): void;
    setupSwagger(): void;
  }
}

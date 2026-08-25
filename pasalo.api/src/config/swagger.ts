// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pasalo API',
      version: '1.0.0',
      description: 'Documentación de la API del backend de Pasalo',
    },
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [path.join(__dirname, '../routes.ts'), path.join(__dirname, '../routes.js')],
};

export const swaggerSpec = swaggerJsdoc(options);

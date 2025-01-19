const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'PayP',
      version: '3.0.0',
      description: 'API documentation for the PayP Platform',
      contact: {
        name: 'Ayishik Das',
        email: 'Ayishikad@gmail.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api', // Update with your Render deployment URL
      },
    ],
  },
  apis: ['./routes/*.js'], // Adjust path based on your project structure
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;

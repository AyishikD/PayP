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
        //url: 'https://payp-swagger.onrender.com/api', // Update with your Render deployment URL
        url:'https://payp.onrender.com/api'
      },
    ],
  },
  apis: ['./routes/*.js'], // Adjust path based on your project structure
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;

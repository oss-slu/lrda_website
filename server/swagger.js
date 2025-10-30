import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LRDA API",
      version: "1.0.0",
      description: "API documentation for the LRDA Express server",
    },
    servers: [
      {
        url: "http://localhost:3001/v1",
      },
    ],
  },
  apis: ["./routes/*.js", "./app.js"], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;

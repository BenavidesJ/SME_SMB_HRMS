import express from "express";
import cors from "cors";
import { db_connection } from "./src/config/db.js";
import { errorHandler } from "./src/middlewares/handleErrors.js";
import securityRoutes from "./src/routes/security.route.js"
import employeeRoutes from "./src/routes/employee.route.js"

const { API_URL, PORT, API_VERSION, WEB_CONSUMER_URL } = process.env;

const app = express();

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    credentials: true,
    origin: [ WEB_CONSUMER_URL ],
  })
);

// API V1 Routes
app.use(`/${API_VERSION}/auth`, securityRoutes);
app.use(`/${API_VERSION}`, employeeRoutes);

// Error handler middleware
app.use(errorHandler);

app.listen(PORT, () => {
  db_connection();
  console.log(`Servidor corriendo en ${API_URL}:${PORT}`);
});
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { db_connection } from "./src/config/db.js";
import { TOO_MANY_REQUESTS } from "./src/common/strings.js";
import { errorHandler } from "./src/middlewares/handleErrors.js";
import securityRoutes from "./src/routes/security.route.js"
import employeeRoutes from "./src/routes/employee.route.js"
import planillasRoutes from "./src/routes/planillas.route.js"
import asistenciaRoutes from "./src/routes/asistencia.route.js"

const { API_URL, PORT, API_VERSION, WEB_CONSUMER_URL, PROD } = process.env;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    credentials: true,
    origin: "*",
  })
);

const isProd = Boolean(PROD) || false;
const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isProd ? 1000 : 10,
  message: {
    status: 429,
    error: TOO_MANY_REQUESTS
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(rateLimiter);
// API V1 Routes
app.use(`/${API_VERSION}/auth`, securityRoutes);
app.use(`/${API_VERSION}`, employeeRoutes);
app.use(`/${API_VERSION}/planillas`, planillasRoutes);
app.use(`/${API_VERSION}/asistencia`, asistenciaRoutes);

// Error handler middleware
app.use(errorHandler);

app.listen(PORT, () => {
  db_connection();
  console.log(`Servidor corriendo en ${API_URL}:${PORT}`);
});
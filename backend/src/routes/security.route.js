import express from "express";
import { authorization } from "../middlewares/authorization.js";
import { login, cambioPassword, resetPassword } from "../modules/seguridad/controllers/auth.controller.js";
import { rolControllers } from "../modules/mantenimientos_consultas/rol/controllers/rol.controller.js";

const router = express.Router();
// Inicio de Sesión
router.post("/login", login);
// Cambio de Contraseña
router.patch("/change-password", authorization, cambioPassword);
// Resetear Contraseña
router.patch("/forgot-password", resetPassword);
// Roles
router.post("/roles", authorization, rolControllers.createController);
router.get("/roles", authorization, rolControllers.listController);
router.get("/roles/:id", authorization, rolControllers.detailController);
router.patch("/roles/:id", authorization, rolControllers.updateController);
router.delete("/roles/:id", authorization, rolControllers.deleteController);

export default router;
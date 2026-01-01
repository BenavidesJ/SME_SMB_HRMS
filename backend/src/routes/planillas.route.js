import express from 'express';
import { authorization } from '../middlewares/authorization.js';
import { crearCicloPago, obtenerTodosCiclos } from '../controllers/planillas/planillas.controller.js';


const router = express.Router();
// Ciclos de pago
router.post('/ciclos_pago', authorization, crearCicloPago);
router.get('/ciclos_pago', authorization, obtenerTodosCiclos);

export default router;
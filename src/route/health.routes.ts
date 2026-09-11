/**
 * route/health.routes.ts
 * ---------------------------------------------------------------------
 * Rutas de infraestructura, montadas en `/health` (no bajo `/api/v1`, ver
 * app.ts) y sin `authenticate`: un orquestador (Docker, Kubernetes, un
 * load balancer) tiene que poder pegarles sin credenciales.
 *
 *   GET /live   - "¿el proceso está vivo?". No toca la base, responde 200
 *                 siempre que el proceso responda. Sirve para que el
 *                 orquestador sepa si hay que reiniciar el contenedor.
 *   GET /ready  - "¿puedo recibir tráfico de verdad?". Hace un `SELECT 1`
 *                 contra la base (ver repository/health.repository.ts) y
 *                 devuelve 503 si no responde — útil para que un load
 *                 balancer deje de mandarle tráfico mientras la base está
 *                 caída, sin necesidad de matar el proceso.
 */
import { Router } from 'express';
import { healthController } from '../controller/health.controller.js';

export const healthRoutes = Router();

healthRoutes.get('/live', healthController.live);
healthRoutes.get('/ready', healthController.ready);

import { Router } from 'express';
import { healthcheck, readiness } from "../controllers/healthcheck.controller.js"

const router = Router();

router.route('/').get(healthcheck);
router.route('/ready').get(readiness);

export default router

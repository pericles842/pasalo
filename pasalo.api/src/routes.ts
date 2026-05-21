// src/routes/user.routes.ts
import { Router } from 'express';
import { PlansController } from './app/controllers/plans.controller';

const router = Router();

//*Plans
router.get('/plans', PlansController.getAllPlans);


export default router;

// src/routes/user.routes.ts
import { Router } from 'express';
import { PlansController } from './app/controllers/plans.controller';
import { CompanyController } from './app/controllers/company.controller';

const router = Router();

//*Plans
router.get('/plans', PlansController.getAllPlans);

//*Company
router.post('/company', CompanyController.registerCompanyProcess);


export default router;

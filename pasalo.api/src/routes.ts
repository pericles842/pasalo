// src/routes/user.routes.ts
import { Router } from 'express';
import { PlansController } from './app/controllers/plans.controller';
import { CompanyController } from './app/controllers/company.controller';
import { AuthController } from './app/controllers/auth.controller';
import { CompanyUserController } from './app/controllers/company_user.controller';
import { jwtMiddleware } from './middlewares/jwtMiddleware';

const router = Router();

//*Auth
router.post('/auth/login', AuthController.login);
router.get('/auth/me', jwtMiddleware, AuthController.me);

//*Plans
router.get('/plans', PlansController.getAllPlans);

//*Company
router.post('/company', CompanyController.registerCompanyProcess);

//*Usuarios de la empresa
router.get('/roles', jwtMiddleware, CompanyUserController.listRoles);
router.get('/company/users', jwtMiddleware, CompanyUserController.listUsers);
router.post('/company/users', jwtMiddleware, CompanyUserController.createUser);
router.delete('/company/users/:uuid', jwtMiddleware, CompanyUserController.deleteUser);
router.put('/company/subscription', jwtMiddleware, CompanyUserController.changePlan);


export default router;

// src/routes/user.routes.ts
import { Router } from 'express';
import { PlansController } from './app/controllers/plans.controller';
import { CompanyController } from './app/controllers/company.controller';
import { AuthController } from './app/controllers/auth.controller';
import { CompanyUserController } from './app/controllers/company_user.controller';
import { OrderController } from './app/controllers/order.controller';
import { OrderStatusController } from './app/controllers/order_status.controller';
import { jwtMiddleware } from './middlewares/jwtMiddleware';
import { tenantMiddleware } from './middlewares/tenantMiddleware';

const router = Router();

// Toda ruta autenticada que toque datos de la empresa necesita resolver su tenant
const authTenant = [jwtMiddleware, tenantMiddleware];

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

//*Ordenes
router.get('/order-statuses', jwtMiddleware, OrderStatusController.listStatuses);
router.get('/orders', authTenant, OrderController.list);
router.post('/orders', authTenant, OrderController.create);
router.put('/orders/:id/status', authTenant, OrderController.updateStatus);


export default router;

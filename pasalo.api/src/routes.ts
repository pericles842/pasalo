// src/routes/user.routes.ts
import { Router } from 'express';
import { PlansController } from './app/controllers/plans.controller';
import { CompanyController } from './app/controllers/company.controller';
import { AuthController } from './app/controllers/auth.controller';
import { CompanyUserController } from './app/controllers/company_user.controller';
import { OrderController } from './app/controllers/order.controller';
import { OrderStatusController } from './app/controllers/order_status.controller';
import { PublicOrderController } from './app/controllers/public_order.controller';
import { PaymentMethodController } from './app/controllers/payment_method.controller';
import { ExchangeRateController } from './app/controllers/exchange_rate.controller';
import { NotificationController } from './app/controllers/notification.controller';
import { jwtMiddleware } from './middlewares/jwtMiddleware';
import { tenantMiddleware } from './middlewares/tenantMiddleware';
import { internalTokenMiddleware } from './middlewares/internalTokenMiddleware';
import { upload } from './middlewares/upload';

const router = Router();

// Toda ruta autenticada que toque datos de la empresa necesita resolver su tenant
const authTenant = [jwtMiddleware, tenantMiddleware];

//*Auth
router.post('/auth/login', AuthController.login);
router.get('/auth/me', jwtMiddleware, AuthController.me);
router.put('/auth/me', jwtMiddleware, upload.single('photo'), AuthController.updateMe);

//*Plans
router.get('/plans', PlansController.getAllPlans);

//*Tasa de cambio (BCV / paralelo)
router.get('/exchange-rate', ExchangeRateController.getRates);
// La ejecuta un demonio externo cada cierto tiempo, no el frontend
router.post('/exchange-rate/sync', internalTokenMiddleware, ExchangeRateController.sync);

//*Company
router.post('/company', CompanyController.registerCompanyProcess);
router.put('/company', jwtMiddleware, upload.single('logo'), CompanyController.updateCompany);

//*Usuarios de la empresa
router.get('/roles', jwtMiddleware, CompanyUserController.listRoles);
router.get('/company/users', jwtMiddleware, CompanyUserController.listUsers);
router.post('/company/users', jwtMiddleware, CompanyUserController.createUser);
router.delete('/company/users/:uuid', jwtMiddleware, CompanyUserController.deleteUser);
router.put('/company/subscription', jwtMiddleware, CompanyUserController.changePlan);
router.get('/company/subscription', jwtMiddleware, CompanyUserController.getSubscriptionStatus);

//*Metodos de pago
router.get('/company/payment-methods', authTenant, PaymentMethodController.list);
router.post('/company/payment-methods', authTenant, PaymentMethodController.create);
router.delete('/company/payment-methods/:id', authTenant, PaymentMethodController.remove);

//*Ordenes
router.get('/order-statuses', jwtMiddleware, OrderStatusController.listStatuses);
router.get('/orders', authTenant, OrderController.list);
router.post('/orders', authTenant, OrderController.create);
// Antes de /orders/:id: si no, Express lo confunde con un id
router.get('/orders/stats', authTenant, OrderController.stats);
router.get('/orders/:id', authTenant, OrderController.getById);
router.put('/orders/:id/status', authTenant, OrderController.updateStatus);

//*Notificaciones
router.get('/notifications', authTenant, NotificationController.list);
router.delete('/notifications/:id', authTenant, NotificationController.remove);
router.delete('/notifications', authTenant, NotificationController.removeAll);

//*Pantalla publica de pago (sin sesion, el token viaja en la url)
router.get('/public/orders/:tenant_id/:token', PublicOrderController.getSummary);
router.post('/public/orders/:tenant_id/:token/pay', upload.single('receipt'), PublicOrderController.submitPayment);


export default router;

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

/**
 * @swagger
 * tags:
 *   - name: Auth
 *   - name: Plans
 *   - name: ExchangeRate
 *   - name: Company
 *   - name: CompanyUsers
 *   - name: PaymentMethods
 *   - name: Orders
 *   - name: Notifications
 *   - name: PublicOrders
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Inicia sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login exitoso }
 */
router.post('/auth/login', AuthController.login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Obtiene el usuario autenticado
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Datos del usuario }
 *   put:
 *     tags: [Auth]
 *     summary: Actualiza el perfil del usuario autenticado
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo: { type: string, format: binary }
 *     responses:
 *       200: { description: Perfil actualizado }
 */
router.get('/auth/me', jwtMiddleware, AuthController.me);
router.put('/auth/me', jwtMiddleware, upload.single('photo'), AuthController.updateMe);

/**
 * @swagger
 * /plans:
 *   get:
 *     tags: [Plans]
 *     summary: Lista todos los planes disponibles
 *     responses:
 *       200: { description: Lista de planes }
 */
router.get('/plans', PlansController.getAllPlans);

/**
 * @swagger
 * /exchange-rate:
 *   get:
 *     tags: [ExchangeRate]
 *     summary: Obtiene las tasas de cambio (BCV / paralelo)
 *     responses:
 *       200: { description: Tasas de cambio actuales }
 */
router.get('/exchange-rate', ExchangeRateController.getRates);

/**
 * @swagger
 * /exchange-rate/sync:
 *   post:
 *     tags: [ExchangeRate]
 *     summary: Sincroniza las tasas de cambio (uso interno, ejecutado por un demonio externo)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Tasas sincronizadas }
 */
router.post('/exchange-rate/sync', internalTokenMiddleware, ExchangeRateController.sync);

/**
 * @swagger
 * /company:
 *   post:
 *     tags: [Company]
 *     summary: Registra una nueva empresa
 *     responses:
 *       201: { description: Empresa registrada }
 *   put:
 *     tags: [Company]
 *     summary: Actualiza los datos de la empresa
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo: { type: string, format: binary }
 *     responses:
 *       200: { description: Empresa actualizada }
 */
router.post('/company', CompanyController.registerCompanyProcess);
router.put('/company', jwtMiddleware, upload.single('logo'), CompanyController.updateCompany);

/**
 * @swagger
 * /roles:
 *   get:
 *     tags: [CompanyUsers]
 *     summary: Lista los roles disponibles
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de roles }
 */
router.get('/roles', jwtMiddleware, CompanyUserController.listRoles);

/**
 * @swagger
 * /company/users:
 *   get:
 *     tags: [CompanyUsers]
 *     summary: Lista los usuarios de la empresa
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de usuarios }
 *   post:
 *     tags: [CompanyUsers]
 *     summary: Crea un usuario para la empresa
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Usuario creado }
 */
router.get('/company/users', jwtMiddleware, CompanyUserController.listUsers);
router.post('/company/users', jwtMiddleware, CompanyUserController.createUser);

/**
 * @swagger
 * /company/users/{uuid}:
 *   delete:
 *     tags: [CompanyUsers]
 *     summary: Elimina un usuario de la empresa
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: uuid
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Usuario eliminado }
 */
router.delete('/company/users/:uuid', jwtMiddleware, CompanyUserController.deleteUser);

/**
 * @swagger
 * /company/subscription:
 *   put:
 *     tags: [CompanyUsers]
 *     summary: Cambia el plan de la suscripción
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Plan actualizado }
 *   get:
 *     tags: [CompanyUsers]
 *     summary: Obtiene el estado de la suscripción
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Estado de la suscripción }
 */
router.put('/company/subscription', jwtMiddleware, CompanyUserController.changePlan);
router.get('/company/subscription', jwtMiddleware, CompanyUserController.getSubscriptionStatus);

/**
 * @swagger
 * /company/payment-methods:
 *   get:
 *     tags: [PaymentMethods]
 *     summary: Lista los métodos de pago de la empresa
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de métodos de pago }
 *   post:
 *     tags: [PaymentMethods]
 *     summary: Crea un método de pago
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Método de pago creado }
 */
router.get('/company/payment-methods', authTenant, PaymentMethodController.list);
router.post('/company/payment-methods', authTenant, PaymentMethodController.create);

/**
 * @swagger
 * /company/payment-methods/{id}:
 *   delete:
 *     tags: [PaymentMethods]
 *     summary: Elimina un método de pago
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Método de pago eliminado }
 */
router.delete('/company/payment-methods/:id', authTenant, PaymentMethodController.remove);

/**
 * @swagger
 * /order-statuses:
 *   get:
 *     tags: [Orders]
 *     summary: Lista los estados de orden disponibles
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de estados }
 */
router.get('/order-statuses', jwtMiddleware, OrderStatusController.listStatuses);

/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: Lista las órdenes de la empresa
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de órdenes }
 *   post:
 *     tags: [Orders]
 *     summary: Crea una nueva orden
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Orden creada }
 */
router.get('/orders', authTenant, OrderController.list);
router.post('/orders', authTenant, OrderController.create);

/**
 * @swagger
 * /orders/stats:
 *   get:
 *     tags: [Orders]
 *     summary: Estadísticas de órdenes
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Estadísticas de órdenes }
 */
// Antes de /orders/:id: si no, Express lo confunde con un id
router.get('/orders/stats', authTenant, OrderController.stats);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Obtiene una orden por id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Datos de la orden }
 */
router.get('/orders/:id', authTenant, OrderController.getById);

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     tags: [Orders]
 *     summary: Actualiza el estado de una orden
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Estado actualizado }
 */
router.put('/orders/:id/status', authTenant, OrderController.updateStatus);

/**
 * @swagger
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: Lista las notificaciones
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de notificaciones }
 *   delete:
 *     tags: [Notifications]
 *     summary: Elimina todas las notificaciones
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Notificaciones eliminadas }
 */
router.get('/notifications', authTenant, NotificationController.list);
router.delete('/notifications', authTenant, NotificationController.removeAll);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     tags: [Notifications]
 *     summary: Elimina una notificación
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Notificación eliminada }
 */
router.delete('/notifications/:id', authTenant, NotificationController.remove);

/**
 * @swagger
 * /public/orders/{tenant_id}/{token}:
 *   get:
 *     tags: [PublicOrders]
 *     summary: Obtiene el resumen público de una orden (sin sesión, el token viaja en la url)
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Resumen de la orden }
 */
router.get('/public/orders/:tenant_id/:token', PublicOrderController.getSummary);

/**
 * @swagger
 * /public/orders/{tenant_id}/{token}/pay:
 *   post:
 *     tags: [PublicOrders]
 *     summary: Envía el comprobante de pago de una orden pública
 *     parameters:
 *       - in: path
 *         name: tenant_id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               receipt: { type: string, format: binary }
 *     responses:
 *       200: { description: Pago registrado }
 */
router.post('/public/orders/:tenant_id/:token/pay', upload.single('receipt'), PublicOrderController.submitPayment);


export default router;

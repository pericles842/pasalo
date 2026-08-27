"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/user.routes.ts
const express_1 = require("express");
const plans_controller_1 = require("./app/controllers/plans.controller");
const company_controller_1 = require("./app/controllers/company.controller");
const auth_controller_1 = require("./app/controllers/auth.controller");
const company_user_controller_1 = require("./app/controllers/company_user.controller");
const order_controller_1 = require("./app/controllers/order.controller");
const order_status_controller_1 = require("./app/controllers/order_status.controller");
const public_order_controller_1 = require("./app/controllers/public_order.controller");
const payment_method_controller_1 = require("./app/controllers/payment_method.controller");
const exchange_rate_controller_1 = require("./app/controllers/exchange_rate.controller");
const notification_controller_1 = require("./app/controllers/notification.controller");
const ads_controller_1 = require("./app/controllers/ads.controller");
const jwtMiddleware_1 = require("./middlewares/jwtMiddleware");
const tenantMiddleware_1 = require("./middlewares/tenantMiddleware");
const internalTokenMiddleware_1 = require("./middlewares/internalTokenMiddleware");
const upload_1 = require("./middlewares/upload");
const router = (0, express_1.Router)();
// Toda ruta autenticada que toque datos de la empresa necesita resolver su tenant
const authTenant = [jwtMiddleware_1.jwtMiddleware, tenantMiddleware_1.tenantMiddleware];
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
 *   - name: Ads
 */
/**
 * @swagger
 * /ads/plans:
 *   get:
 *     tags: [Ads]
 *     summary: Lista los planes de publicidad activos (tarifario para anunciantes)
 *     responses:
 *       200: { description: Lista de planes de publicidad }
 */
router.get('/ads/plans', ads_controller_1.AdsController.getPlans);
/**
 * @swagger
 * /ads/locations:
 *   get:
 *     tags: [Ads]
 *     summary: Lista el catalogo de ubicaciones de publicidad disponibles
 *     responses:
 *       200: { description: Lista de ubicaciones }
 */
router.get('/ads/locations', ads_controller_1.AdsController.getLocations);
/**
 * @swagger
 * /ads/{placement}:
 *   get:
 *     tags: [Ads]
 *     summary: Sortea un anuncio activo para una ubicacion (ver /ads/locations para las claves disponibles)
 *     parameters:
 *       - in: path
 *         name: placement
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Anuncio seleccionado }
 *       204: { description: No hay anuncios activos para esa ubicacion }
 */
router.get('/ads/:placement', ads_controller_1.AdsController.getAdForPlacement);
/**
 * @swagger
 * /ads/{id}/click:
 *   post:
 *     tags: [Ads]
 *     summary: Registra un click sobre un anuncio
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Click registrado }
 *       404: { description: Anuncio no encontrado }
 */
router.post('/ads/:id/click', ads_controller_1.AdsController.registerClick);
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
router.post('/auth/login', auth_controller_1.AuthController.login);
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
router.get('/auth/me', jwtMiddleware_1.jwtMiddleware, auth_controller_1.AuthController.me);
router.put('/auth/me', jwtMiddleware_1.jwtMiddleware, upload_1.upload.single('photo'), auth_controller_1.AuthController.updateMe);
/**
 * @swagger
 * /plans:
 *   get:
 *     tags: [Plans]
 *     summary: Lista todos los planes disponibles
 *     responses:
 *       200: { description: Lista de planes }
 */
router.get('/plans', plans_controller_1.PlansController.getAllPlans);
/**
 * @swagger
 * /exchange-rate:
 *   get:
 *     tags: [ExchangeRate]
 *     summary: Obtiene las tasas de cambio (BCV / paralelo)
 *     responses:
 *       200: { description: Tasas de cambio actuales }
 */
router.get('/exchange-rate', exchange_rate_controller_1.ExchangeRateController.getRates);
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
router.post('/exchange-rate/sync', internalTokenMiddleware_1.internalTokenMiddleware, exchange_rate_controller_1.ExchangeRateController.sync);
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
 *               link_expiration_minutes: { type: integer, minimum: 1, maximum: 120, description: 'Duracion del link publico de pago (1-120 min)' }
 *     responses:
 *       200: { description: Empresa actualizada }
 */
router.post('/company', company_controller_1.CompanyController.registerCompanyProcess);
router.put('/company', jwtMiddleware_1.jwtMiddleware, upload_1.upload.single('logo'), company_controller_1.CompanyController.updateCompany);
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
router.get('/roles', jwtMiddleware_1.jwtMiddleware, company_user_controller_1.CompanyUserController.listRoles);
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
router.get('/company/users', jwtMiddleware_1.jwtMiddleware, company_user_controller_1.CompanyUserController.listUsers);
router.post('/company/users', jwtMiddleware_1.jwtMiddleware, company_user_controller_1.CompanyUserController.createUser);
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
router.delete('/company/users/:uuid', jwtMiddleware_1.jwtMiddleware, company_user_controller_1.CompanyUserController.deleteUser);
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
router.put('/company/subscription', jwtMiddleware_1.jwtMiddleware, company_user_controller_1.CompanyUserController.changePlan);
router.get('/company/subscription', jwtMiddleware_1.jwtMiddleware, company_user_controller_1.CompanyUserController.getSubscriptionStatus);
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
router.get('/company/payment-methods', authTenant, payment_method_controller_1.PaymentMethodController.list);
router.post('/company/payment-methods', authTenant, payment_method_controller_1.PaymentMethodController.create);
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
router.delete('/company/payment-methods/:id', authTenant, payment_method_controller_1.PaymentMethodController.remove);
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
router.get('/order-statuses', jwtMiddleware_1.jwtMiddleware, order_status_controller_1.OrderStatusController.listStatuses);
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
router.get('/orders', authTenant, order_controller_1.OrderController.list);
router.post('/orders', authTenant, order_controller_1.OrderController.create);
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
router.get('/orders/stats', authTenant, order_controller_1.OrderController.stats);
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
router.get('/orders/:id', authTenant, order_controller_1.OrderController.getById);
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
router.put('/orders/:id/status', authTenant, order_controller_1.OrderController.updateStatus);
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
router.get('/notifications', authTenant, notification_controller_1.NotificationController.list);
router.delete('/notifications', authTenant, notification_controller_1.NotificationController.removeAll);
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
router.delete('/notifications/:id', authTenant, notification_controller_1.NotificationController.remove);
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
router.get('/public/orders/:tenant_id/:token', public_order_controller_1.PublicOrderController.getSummary);
/**
 * @swagger
 * /public/orders/{tenant_id}/{token}/buyer:
 *   put:
 *     tags: [PublicOrders]
 *     summary: Paso 1 del link publico -  el cliente llena sus propios datos
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
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name: { type: string }
 *               last_name: { type: string }
 *               email: { type: string }
 *               ci: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *     responses:
 *       200: { description: Datos guardados }
 */
router.put('/public/orders/:tenant_id/:token/buyer', public_order_controller_1.PublicOrderController.submitBuyerData);
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
router.post('/public/orders/:tenant_id/:token/pay', upload_1.upload.single('receipt'), public_order_controller_1.PublicOrderController.submitPayment);
exports.default = router;

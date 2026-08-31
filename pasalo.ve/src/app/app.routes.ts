import { Routes } from '@angular/router';


import { Home } from './pages/home/home';
import { Pricing } from './pages/pricing/pricing';
import { Ads } from './pages/ads/ads';
import { Terms } from './pages/terms/terms';
import { Privacy } from './pages/privacy/privacy';
import { Cookies } from './pages/cookies/cookies';
import { RegisterCompany } from './pages/register-company/register-company';
import { Dashboard } from './layout/dashboard/dashboard';
import { WebClient } from './layout/web-client/web-client';
import { Login } from './features/auth/pages/login/login';
import { UsersPage } from './features/users/pages/users-page/users-page';
import { PaymentMethodsPage } from './features/payment-methods/pages/payment-methods-page/payment-methods-page';
import { NotificationsPage } from './features/notifications/pages/notifications-page/notifications-page';
import { PublicPayment } from './features/orders/pages/public-payment/public-payment';
import { ProfilePage } from './features/profile/pages/profile-page/profile-page';
import { CompanyPage } from './features/company/pages/company-page/company-page';
import { NotFound } from './pages/not-found/not-found';
import { authGuard } from './features/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: WebClient,
    children: [
      {
        path: '', component: Home,
        title: 'Pásalo | Cobra pago móvil y gestiona tu negocio en Venezuela',
        data: {
          description: 'Pásalo es la plataforma venezolana para vender y cobrar: gestiona pedidos, recibe pagos por pago móvil o transferencia en bolívares o dólares, y verifica cada comprobante desde un solo lugar.',
        },
      },
      {
        path: 'precios', component: Pricing,
        title: 'Precios | Planes para vender y cobrar en Venezuela - Pásalo',
        data: {
          description: 'Conoce los planes de Pásalo para gestionar ventas y cobrar pago móvil o transferencia en Venezuela. Elige el plan que se ajusta a tu negocio, sin contratos ni letra pequeña.',
        },
      },
      {
        path: 'publicidad', component: Ads,
        title: 'Publicidad | Anúnciate a negocios venezolanos - Pásalo',
        data: {
          description: 'Anuncia tu marca dentro del panel de miles de vendedores venezolanos que usan Pásalo cada día para gestionar sus ventas y cobros.',
        },
      },
      {
        path: 'terminos-y-condiciones', component: Terms,
        title: 'Términos y condiciones | Pásalo',
        data: {
          description: 'Términos y condiciones de uso de la plataforma Pásalo para empresas y usuarios en Venezuela.',
        },
      },
      {
        path: 'politica-de-privacidad', component: Privacy,
        title: 'Política de privacidad | Pásalo',
        data: {
          description: 'Política de privacidad de Pásalo: cómo protegemos y utilizamos la información de nuestros usuarios y empresas en Venezuela.',
        },
      },
      {
        path: 'politica-de-cookies', component: Cookies,
        title: 'Política de cookies | Pásalo',
        data: {
          description: 'Política de cookies de Pásalo: qué cookies utilizamos y para qué dentro de nuestra plataforma para negocios venezolanos.',
        },
      },
      {
        path: 'create-company', component: RegisterCompany,
        title: 'Crea tu cuenta gratis | Pásalo',
        data: {
          description: 'Crea tu cuenta gratis en Pásalo y empieza a gestionar tus ventas y a cobrar pago móvil o transferencia en minutos.',
        },
      },
    ],
  },
  // Pantalla independiente: sin el header ni los margenes del WebClient
  { path: 'login', component: Login, title: 'Iniciar sesión | Pásalo.ve' },
  // Link de pago publico: sin sesion, sin layout
  { path: 'p/:tenant_id/:token', component: PublicPayment, title: 'Confirma tu pago | Pásalo.ve' },
  {
    path: 'dashboard',
    component: Dashboard,
    title: 'Dashboard',
    canActivate: [authGuard],
    children: [
      { path: 'profile', component: ProfilePage, title: 'Mi perfil | Pásalo.ve' },
      { path: 'company', component: CompanyPage, title: 'Empresa | Pásalo.ve' },
      { path: 'users', component: UsersPage, title: 'Usuarios | Pásalo.ve' },
      { path: 'payment-methods', component: PaymentMethodsPage, title: 'Métodos de pago | Pásalo.ve' },
      { path: 'notifications', component: NotificationsPage, title: 'Notificaciones | Pásalo.ve' },
      {
        path: '',
        loadChildren: () =>
          import('./features/orders/order.routing.module').then((m) => m.OrdersRoutingModule),
      },
      // Cualquier sub-ruta del dashboard que no matcheo nada de arriba: se
      // muestra dentro del layout (sidebar/header), no del wildcard de mas abajo
      { path: '**', component: NotFound, title: 'Página no encontrada | Pásalo.ve' },
    ],
  },
  // Cualquier ruta que no matcheo nada de lo anterior
  { path: '**', component: NotFound, title: 'Página no encontrada | Pásalo.ve' },
];

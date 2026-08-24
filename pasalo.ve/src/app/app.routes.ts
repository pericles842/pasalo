import { Routes } from '@angular/router';


import { Home } from './pages/home/home';
import { Pricing } from './pages/pricing/pricing';
import { Terms } from './pages/terms/terms';
import { Privacy } from './pages/privacy/privacy';
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
import { authGuard } from './features/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: WebClient,
    children: [
      { path: '', component: Home, title: 'Pásalo.ve' },
      { path: 'precios', component: Pricing, title: 'Precios | Pásalo.ve' },
      { path: 'terminos-y-condiciones', component: Terms, title: 'Términos y condiciones | Pásalo.ve' },
      { path: 'politica-de-privacidad', component: Privacy, title: 'Política de privacidad | Pásalo.ve' },
      { path: 'create-company', component: RegisterCompany, title: 'Pásalo.ve' },
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
    ],
  },
];

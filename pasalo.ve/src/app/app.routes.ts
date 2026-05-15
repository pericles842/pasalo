import { Routes } from '@angular/router';


import { Home } from './pages/home/home';
import { RegisterCompany } from './pages/register-company/register-company';
import { Dashboard } from './layout/dashboard/dashboard';
import { WebClient } from './layout/web-client/web-client';

export const routes: Routes = [
  {
    path: '',
    component: WebClient,
    children: [
      { path: '', component: Home, title: 'Pásalo.ve' },
      { path: 'create-company', component: RegisterCompany, title: 'Pásalo.ve' },
    ],
  },
  {
    path: 'dashboard',
    component: Dashboard,
    title: 'Dashboard',
    loadChildren: () =>
      import('./features/orders/order.routing.module').then((m) => m.OrdersRoutingModule),
  },
];

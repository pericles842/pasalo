import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Dashboard } from './layout/dashboard/dashboard';

export const routes: Routes = [
  {
    path: '',
    component: Home,
    title: 'Pásalo.ve',
  },
  {
    path: 'dashboard',
    component: Dashboard,
    title: 'Dashboard',
    loadChildren: () =>
      import('./features/orders/order.routing.module').then((m) => m.OrdersRoutingModule),
  },
];

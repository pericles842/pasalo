import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { OrdersForm } from "./pages/orders-form/orders-form";
import { OrdersList } from "./pages/orders-list/orders-list";
import { OrderDetail } from "./pages/order-detail/order-detail";
import { OrdersStats } from "./pages/orders-stats/orders-stats";

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  { path: 'list', component: OrdersList },
  { path: 'form', component: OrdersForm },
  { path: 'stats', component: OrdersStats },
  // Debe ir despues de las rutas fijas: ':id' calzaria con cualquier segmento
  { path: ':id', component: OrderDetail },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule { }

import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { OrdersForm } from "./pages/orders-form/orders-form";
import { OrdersList } from "./pages/orders-list/orders-list";

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  { path: 'list', component: OrdersList },
  { path: 'form', component: OrdersForm },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule { }

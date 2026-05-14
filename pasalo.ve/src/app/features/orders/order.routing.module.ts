import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { OrdersForm } from "./pages/orders-form/orders-form";

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'form' },
  { path: 'form', component: OrdersForm, },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule { }


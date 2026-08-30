import { NgModule } from "@angular/core";
import { RouterModule, Routes, UrlMatchResult, UrlSegment } from "@angular/router";
import { OrdersForm } from "./pages/orders-form/orders-form";
import { OrdersList } from "./pages/orders-list/orders-list";
import { OrderDetail } from "./pages/order-detail/order-detail";
import { OrdersStats } from "./pages/orders-stats/orders-stats";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Los id de orden son UUID: sin esto, un `path: ':id'` haria match con
 * cualquier segmento (incluida una URL invalida), y nunca dejaria que la
 * ruta comodin de 404 se activara.
 */
function orderIdMatcher(segments: UrlSegment[]): UrlMatchResult | null {
  if (segments.length === 1 && UUID_PATTERN.test(segments[0].path)) {
    return { consumed: segments, posParams: { id: segments[0] } };
  }
  return null;
}

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  { path: 'list', component: OrdersList },
  { path: 'form', component: OrdersForm },
  { path: 'stats', component: OrdersStats },
  { matcher: orderIdMatcher, component: OrderDetail },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule { }

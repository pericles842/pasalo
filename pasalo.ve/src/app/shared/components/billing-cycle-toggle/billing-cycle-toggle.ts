import { Component, model } from '@angular/core';
import { NbButtonGroupModule, NbButtonModule } from '@nebular/theme';
import { BillingCycle } from '@shared/utils/billing';

/**
 * Selector segmentado "Mensual / Anual" que se reutiliza en todos los listados
 * de planes (precios, publicidad, registro, cambio de plan). Solo emite el
 * ciclo elegido; el cálculo del precio anual vive en `@shared/utils/billing`.
 */
@Component({
  selector: 'app-billing-cycle-toggle',
  imports: [NbButtonModule, NbButtonGroupModule],
  template: `
    <nb-button-group size="small" (valueChange)="onValueChange($event)">
      <button nbButtonToggle value="monthly" [pressed]="cycle() === 'monthly'">Mensual</button>
      <button nbButtonToggle value="annual" [pressed]="cycle() === 'annual'">
        Anual
        <span class="ml-1 font-bold" [class.text-green-600]="cycle() !== 'annual'">&minus;20%</span>
      </button>
    </nb-button-group>
  `,
})
export class BillingCycleToggle {
  readonly cycle = model<BillingCycle>('monthly');

  onValueChange(values: unknown[]): void {
    // En modo single el grupo emite un arreglo con el único toggle presionado;
    // si llega vacío (doble click sobre el activo) se ignora para no perder el valor.
    const next = values?.[0] as BillingCycle | undefined;
    if (next && next !== this.cycle()) this.cycle.set(next);
  }
}

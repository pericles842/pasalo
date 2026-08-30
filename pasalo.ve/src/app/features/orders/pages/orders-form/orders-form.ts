import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbButtonModule, NbIconModule, NbInputModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { GeneralTitleForm } from '@shared/elements/general-title-form/general-title-form';
import { ToastService } from '@shared/services/toast.service';
import { ExchangeRateService } from '@shared/services/exchange-rate.service';
import { BsAmountPipe } from '@shared/pipes/bs-amount.pipe';
import { PaymentMethodsService } from 'src/app/features/payment-methods/payment-methods.service';
import { CreateOrderResponse, OrderItemForm } from '../../interfaces/order';
import { OrdersService } from '../../orders.service';

@Component({
  selector: 'app-orders-form',
  imports: [ReactiveFormsModule, NbButtonModule, GlobalInput, NbEvaIconsModule, NbIconModule, NbInputModule, GeneralTitleForm, BsAmountPipe, DecimalPipe, RouterLink],
  templateUrl: './orders-form.html',
  styleUrl: './orders-form.scss',
})
export class OrdersForm implements OnInit, OnDestroy {

  private ordersService = inject(OrdersService);
  private paymentMethodsService = inject(PaymentMethodsService);
  private toast = inject(ToastService);
  protected exchangeRate = inject(ExchangeRateService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  private items_subscription?: Subscription;

  is_saving = signal(false);

  /** Sin metodos de pago el cliente nunca podria pagar el link que se genera */
  is_checking_payment_methods = signal(true);
  has_payment_methods = signal(false);

  /** La orden recien creada: se muestra el link de pago para copiarlo */
  created_order = signal<CreateOrderResponse | null>(null);

  items = new FormArray<FormGroup<OrderItemForm>>([this.buildItem()]);

  notes = new FormControl<string | null>(null);

  /** Bs a cobrar: se sugiere con la tasa activa, pero el vendedor lo puede editar libremente */
  bs_amount = new FormControl<number | null>(null);
  private bs_amount_edited = false;

  items_total = signal(0);

  get items_controls() {
    return this.items.controls;
  }

  constructor() {
    // Mientras el vendedor no toque el campo Bs a mano, se mantiene sugerido
    // segun el total en $ y la tasa activa de la empresa
    effect(() => {
      const total = this.items_total();
      const rate = this.exchangeRate.activeRate();

      if (this.bs_amount_edited) return;

      this.bs_amount.setValue(rate ? Math.round(total * rate * 100) / 100 : null, { emitEvent: false });
    });
  }

  ngOnInit(): void {
    this.items_subscription = this.items.valueChanges.subscribe(() => this.recalculateTotal());
    this.recalculateTotal();

    if (!this.is_browser) return;

    this.paymentMethodsService.getPaymentMethods().subscribe({
      next: ({ methods }) => {
        this.has_payment_methods.set(methods.length > 0);
        this.is_checking_payment_methods.set(false);
      },
      error: () => {
        // Si falla la verificacion no bloqueamos la pantalla: el backend igual
        // rechaza la creacion si de verdad no hay metodos de pago cargados
        this.has_payment_methods.set(true);
        this.is_checking_payment_methods.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    this.items_subscription?.unsubscribe();
  }

  private buildItem(): FormGroup<OrderItemForm> {
    return new FormGroup<OrderItemForm>({
      name: new FormControl(null, [Validators.required]),
      reference: new FormControl(null),
      price: new FormControl(null, [Validators.required, Validators.min(0.01)]),
    });
  }

  private recalculateTotal(): void {
    const total = this.items.controls.reduce((sum, item) => sum + (Number(item.controls.price.value) || 0), 0);
    this.items_total.set(Math.round(total * 100) / 100);
  }

  onBsAmountInput(): void {
    this.bs_amount_edited = true;
  }

  addItem(): void {
    this.items.push(this.buildItem());
  }

  removeItem(index: number): void {
    if (this.items.length === 1) return;
    this.items.removeAt(index);
  }

  copyPayUrl(): void {
    const url = this.created_order()?.pay_url;
    if (!url || !this.is_browser) return;

    navigator.clipboard.writeText(url).then(
      () => this.toast.success('Link de pago copiado.'),
      () => this.toast.error('No pudimos copiar el link, cópialo manualmente.')
    );
  }

  createAnother(): void {
    this.created_order.set(null);
    this.notes.reset();
    this.bs_amount.reset();
    this.bs_amount_edited = false;
    while (this.items.length > 1) this.items.removeAt(0);
    this.items.at(0).reset();
  }

  onSubmit(): void {
    if (this.is_saving()) return;

    this.items.markAllAsTouched();

    if (this.items.invalid) {
      this.toast.error('Revisa los datos de los productos.');
      return;
    }

    this.is_saving.set(true);

    this.ordersService
      .createOrder({
        items: this.items.getRawValue().map((item) => ({
          name: item.name!,
          reference: item.reference,
          price: Number(item.price),
        })),
        notes: this.notes.value,
        bs_amount: this.bs_amount.value,
      })
      .subscribe({
        next: (response) => {
          this.is_saving.set(false);
          this.created_order.set(response);
          this.toast.success('Orden creada. Comparte el link de pago con el cliente.');
        },
        error: (err) => {
          this.is_saving.set(false);
          this.toast.error(err?.error?.error ?? 'No pudimos crear la orden.');
        }
      });
  }
}

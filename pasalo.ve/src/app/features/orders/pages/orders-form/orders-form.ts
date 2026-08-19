import { isPlatformBrowser } from '@angular/common';
import { Component, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbButtonModule, NbIconModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { Subscription } from 'rxjs';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { GeneralTitleForm } from '@shared/elements/general-title-form/general-title-form';
import { ToastService } from '@shared/services/toast.service';
import { BuyerForm, CreateOrderResponse, OrderItemForm } from '../../interfaces/order';
import { OrdersService } from '../../orders.service';

@Component({
  selector: 'app-orders-form',
  imports: [ReactiveFormsModule, NbButtonModule, GlobalInput, NbEvaIconsModule, NbIconModule, GeneralTitleForm],
  templateUrl: './orders-form.html',
  styleUrl: './orders-form.scss',
})
export class OrdersForm implements OnInit, OnDestroy {

  private ordersService = inject(OrdersService);
  private toast = inject(ToastService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  private items_subscription?: Subscription;

  is_saving = signal(false);

  /** La orden recien creada: se muestra el link de pago para copiarlo */
  created_order = signal<CreateOrderResponse | null>(null);

  buyer_form = new FormGroup<BuyerForm>({
    first_name: new FormControl(null, [Validators.required]),
    last_name: new FormControl(null, [Validators.required]),
    email: new FormControl(null, [Validators.required, Validators.email]),
    ci: new FormControl(null, [Validators.required]),
    phone: new FormControl(null, [Validators.required]),
    address: new FormControl(null, [Validators.required]),
  });

  items = new FormArray<FormGroup<OrderItemForm>>([this.buildItem()]);

  notes = new FormControl<string | null>(null);

  items_total = signal(0);

  get items_controls() {
    return this.items.controls;
  }

  ngOnInit(): void {
    this.items_subscription = this.items.valueChanges.subscribe(() => this.recalculateTotal());
    this.recalculateTotal();
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
    this.buyer_form.reset();
    this.notes.reset();
    while (this.items.length > 1) this.items.removeAt(0);
    this.items.at(0).reset();
  }

  onSubmit(): void {
    if (this.is_saving()) return;

    this.buyer_form.markAllAsTouched();
    this.items.markAllAsTouched();

    if (this.buyer_form.invalid || this.items.invalid) {
      this.toast.error('Revisa los datos del comprador y de los productos.');
      return;
    }

    this.is_saving.set(true);

    const buyer = this.buyer_form.getRawValue();

    this.ordersService
      .createOrder({
        buyer: {
          first_name: buyer.first_name!,
          last_name: buyer.last_name!,
          email: buyer.email!,
          ci: buyer.ci!,
          phone: buyer.phone!,
          address: buyer.address!,
        },
        items: this.items.getRawValue().map((item) => ({
          name: item.name!,
          reference: item.reference,
          price: Number(item.price),
        })),
        notes: this.notes.value,
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

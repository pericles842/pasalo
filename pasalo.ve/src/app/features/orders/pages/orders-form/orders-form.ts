import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NbButtonModule } from '@nebular/theme';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { OrderFormGroup } from '@shared/interfaces/order';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { NbIconModule } from '@nebular/theme';
import { GeneralTitleForm } from "@shared/elements/general-title-form/general-title-form";
@Component({
  selector: 'app-orders-form',
  imports: [ReactiveFormsModule, NbButtonModule, GlobalInput, NbEvaIconsModule, NbIconModule, GeneralTitleForm],
  templateUrl: './orders-form.html',
  styleUrl: './orders-form.scss',
})
export class OrdersForm {

  readonly orderForm = new FormGroup<OrderFormGroup>({
    name_product: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    amount: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    price: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0.01)],
    }),
    name_client: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)],
    }),
    ci_client: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    email_client: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email],
    }),
    pay_url_token: new FormControl(),
  });

  onSubmit(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    console.log(this.orderForm.getRawValue());
  }

}

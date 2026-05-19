import { FormControl } from "@angular/forms";
export interface CardSubscriptionPlan {
  title: string;
  description: string;
  full_description: string;
  price: number;
  status: string;
  is_free: boolean;
}

export interface CardSubscriptionPlanControls {
  title: FormControl<string>;
  description: FormControl<string>;
  full_description: FormControl<string>;
  price: FormControl<number>;
  status: FormControl<string>;
  is_free: FormControl<boolean>;
}

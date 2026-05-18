import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-general-title-form',
  imports: [],
  template: `
    <section class="flex flex-col gap-1">
  <span class="text-2xl font-bold">{{ title }}</span>
  <span>{{ description }}</span>
</section>
  `,
  styles: ``,
})
export class GeneralTitleForm {
  @Input({ required: true }) title = '';
  @Input({ required: true }) description = '';

}

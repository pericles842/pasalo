import { isPlatformBrowser } from '@angular/common';
import { Component, PLATFORM_ID, inject } from '@angular/core';
import { NbSpinnerModule } from '@nebular/theme';
import { LoadingService } from '@shared/services/loading.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [NbSpinnerModule],
  templateUrl: './loading-spinner.component.html',
  styleUrl: './loading-spinner.component.scss',
})
export class LoadingSpinnerComponent {
  protected readonly loadingService = inject(LoadingService);
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
}

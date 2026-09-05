import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NbLayoutModule } from '@nebular/theme';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';
import { InstallPwaButton } from './shared/components/install-pwa-button/install-pwa-button';
import { PushClickService } from './features/notifications/push-click.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingSpinnerComponent, NbLayoutModule, InstallPwaButton],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private pushClick = inject(PushClickService);

  protected readonly title = signal('pasalo.ve');

  constructor() {
    this.pushClick.listen();
  }
}

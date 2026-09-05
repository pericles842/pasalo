import { Component, computed, inject, signal } from '@angular/core';
import { NbButtonModule, NbIconModule } from '@nebular/theme';
import { PwaInstallService } from '../../services/pwa-install.service';

@Component({
  selector: 'app-install-pwa-button',
  imports: [NbButtonModule, NbIconModule],
  templateUrl: './install-pwa-button.html',
})
export class InstallPwaButton {

  protected pwa = inject(PwaInstallService);

  showIosHint = signal(false);

  /** Visible si no esta instalada y (hay prompt nativo o es iOS Safari, que necesita el instructivo manual) */
  visible = computed(() => !this.pwa.isInstalled() && (this.pwa.canInstall() || this.pwa.isIos()));

  onClick(): void {
    if (this.pwa.isIos()) {
      this.showIosHint.set(true);
      return;
    }
    this.pwa.promptInstall();
  }

  closeHint(): void {
    this.showIosHint.set(false);
  }
}

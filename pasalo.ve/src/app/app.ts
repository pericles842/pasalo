import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NbLayoutModule } from '@nebular/theme';
import { LoadingSpinnerComponent } from './shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingSpinnerComponent, NbLayoutModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('pasalo.ve');
}

import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NbButtonModule, NbCardModule } from '@nebular/theme';
import { Copyright } from '@shared/components/copyright/copyright';
import { AuthService } from '../../features/auth/auth.service';

@Component({
  selector: 'app-not-found',
  imports: [NbCardModule, NbButtonModule, RouterLink, Copyright],
  templateUrl: './not-found.html',
})
export class NotFound {
  protected auth = inject(AuthService);
}

import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NbButtonModule } from '@nebular/theme';
import { HeaderDashboard } from '@shared/components/header-dashboard/header-dashboard';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, NbButtonModule, HeaderDashboard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {}

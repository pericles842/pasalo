import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NbButtonModule } from '@nebular/theme';

@Component({
  selector: 'app-web-client',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NbButtonModule],
  templateUrl: './web-client.html',
  styleUrl: './web-client.scss',
})
export class WebClient { }

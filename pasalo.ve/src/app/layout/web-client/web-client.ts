import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { NbButtonModule } from '@nebular/theme';
import { Footer } from 'src/app/shared/components/footer/footer';
import { Copyright } from 'src/app/shared/components/copyright/copyright';

@Component({
  selector: 'app-web-client',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NbButtonModule, Footer, Copyright],
  templateUrl: './web-client.html',
  styleUrl: './web-client.scss',
})
export class WebClient { }

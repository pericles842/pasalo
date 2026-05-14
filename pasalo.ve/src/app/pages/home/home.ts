import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NbButtonModule } from '@nebular/theme';
@Component({
  selector: 'app-home',
  imports: [RouterLink, NbButtonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home { }

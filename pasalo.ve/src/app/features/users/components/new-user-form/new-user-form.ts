import { Component, Input, OnInit, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NbSelectModule } from '@nebular/theme';
import { GlobalInput } from '@shared/components/global-input/global-input';
import { CreateUserForm, Role } from '../../interfaces/company-user';
import { UsersService } from '../../users.service';

/**
 * Formulario puro (sin signals en su template) para aislar el nb-select
 * del resto de la pantalla: bajo zoneless, un template con signals
 * cambiando alrededor del overlay del select dispara el NG0100 de Nebular.
 */
@Component({
  selector: 'app-new-user-form',
  imports: [ReactiveFormsModule, NbSelectModule, GlobalInput],
  templateUrl: './new-user-form.html',
})
export class NewUserForm implements OnInit {

  private usersService = inject(UsersService);

  @Input({ required: true }) form!: FormGroup<CreateUserForm>;

  // El administrador nunca aparece: la API ya lo excluye de /roles
  roles: Role[] = [];

  ngOnInit(): void {
    this.usersService.getRoles().subscribe((roles) => (this.roles = roles));
  }
}

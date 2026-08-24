import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { getInitials } from '@shared/utils/initials';
import { LoginResponse, Session, SessionCompany, SessionRole, SessionUser } from './interfaces/auth';

const TOKEN_KEY = 'pasalo_token';
const SESSION_KEY = 'pasalo_session';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private http = inject(HttpClient);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  // Sesión en memoria: se hidrata desde el storage al arrancar en el navegador
  private session_signal = signal<Session | null>(this.readSession());

  readonly session = this.session_signal.asReadonly();
  readonly is_logged_in = computed(() => this.session_signal() !== null);
  readonly full_name = computed(() => {
    const user = this.session_signal()?.user;
    return user ? `${user.first_name} ${user.middle_name ?? ''}`.trim() : '';
  });
  readonly initials = computed(() => {
    const user = this.session_signal()?.user;
    if (!user) return '';
    return getInitials(`${user.first_name} ${user.middle_name ?? ''}`);
  });
  readonly company_initials = computed(() => getInitials(this.session_signal()?.company?.name));

  /**
   * Inicia sesión y guarda el token de la empresa
   *
   * @param {string} email
   * @param {string} password
   * @memberof AuthService
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.host}/auth/login`, { email, password })
      .pipe(tap((response) => this.saveSession(response)));
  }

  /**
   * Reemplaza el usuario/rol/empresa de la sesion actual sin tocar el token,
   * usado tras editar el perfil propio o los datos de la empresa.
   */
  refreshSession(user: SessionUser, role: SessionRole, company: SessionCompany): void {
    const session: Session = { user, role, company };

    if (this.is_browser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    this.session_signal.set(session);
  }

  logout(): void {
    if (this.is_browser) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
    }
    this.session_signal.set(null);
  }

  get token(): string | null {
    return this.is_browser ? localStorage.getItem(TOKEN_KEY) : null;
  }

  private saveSession(response: LoginResponse): void {
    const session: Session = {
      user: response.user,
      role: response.role,
      company: response.company
    };

    if (this.is_browser) {
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    this.session_signal.set(session);
  }

  private readSession(): Session | null {
    if (!this.is_browser) return null;

    const raw = localStorage.getItem(SESSION_KEY);

    if (!raw || !localStorage.getItem(TOKEN_KEY)) return null;

    try {
      return JSON.parse(raw) as Session;
    } catch {
      return null;
    }
  }
}

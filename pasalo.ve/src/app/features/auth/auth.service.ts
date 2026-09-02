import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { getInitials } from '@shared/utils/initials';
import { GoogleAuthResponse, GoogleIdentity, LoginResponse, Session, SessionCompany, SessionRole, SessionUser } from './interfaces/auth';

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
   * Identidad de Google en transito del login hacia el registro de empresa:
   * cuando alguien intenta entrar con Google y ese correo no tiene cuenta
   * todavia, el login la deja aca y navega a /create-company, que la
   * consume para saltarse el paso de "Usuario" (ver RegisterCompany.ngOnInit).
   * Vive solo en memoria: sobrevive la navegacion del SPA, no un refresh.
   */
  pending_google_identity = signal<(GoogleIdentity & { id_token: string }) | null>(null);

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
   * Inicia sesión con un id_token de Google Identity Services. Si el correo
   * todavia no tiene cuenta (is_new:true), no guarda nada: el caller sigue
   * con el registro de empresa.
   */
  loginWithGoogle(id_token: string): Observable<GoogleAuthResponse> {
    return this.http
      .post<GoogleAuthResponse>(`${environment.host}/auth/google`, { id_token })
      .pipe(tap((response) => { if (!response.is_new) this.saveSession(response); }));
  }

  /**
   * Refresca el usuario/rol/empresa desde el backend sin tocar el token.
   * Util cuando la sesion guardada en el navegador puede estar desactualizada
   * (ej. has_password: la sesion cacheada de un login viejo no lo trae).
   */
  me(): Observable<Session> {
    return this.http
      .get<Session>(`${environment.host}/auth/me`)
      .pipe(tap((session) => this.refreshSession(session.user, session.role, session.company)));
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

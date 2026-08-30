import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/features/auth/auth.service';

export interface OrderPaidNotification {
  order_id: string;
  buyer_name: string;
  amount: number;
  reference: string | null;
  receipt_url: string;
  /** El monto extraído del comprobante no coincidía: la orden sigue en espera */
  is_suspicious: boolean;
}

export interface OrderStatusChangedNotification {
  order_id: string;
  status_id: number;
}

/**
 * Notificaciones en vivo del panel: se conecta con el mismo token de sesión
 * y escucha cuando un cliente completa el pago de una orden.
 */
@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {

  private auth = inject(AuthService);
  private is_browser = isPlatformBrowser(inject(PLATFORM_ID));

  private socket: Socket | null = null;

  connect(): void {
    if (!this.is_browser || this.socket?.connected) return;

    const token = this.auth.token;
    if (!token) return;

    this.socket = io(environment.socketHost, { auth: { token } });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  onOrderPaid(callback: (payload: OrderPaidNotification) => void): void {
    this.socket?.on('order:paid', callback);
  }

  /** Quita un listener registrado con onOrderPaid, útil al destruir un componente */
  offOrderPaid(callback: (payload: OrderPaidNotification) => void): void {
    this.socket?.off('order:paid', callback);
  }

  onOrderStatusChanged(callback: (payload: OrderStatusChangedNotification) => void): void {
    this.socket?.on('order:status-changed', callback);
  }

  offOrderStatusChanged(callback: (payload: OrderStatusChangedNotification) => void): void {
    this.socket?.off('order:status-changed', callback);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}

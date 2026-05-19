import { CardSubscriptionPlan } from "@shared/components/card-subscription-plan/card-subscription-plan.d";

export const PLANS: CardSubscriptionPlan[] = [
  {
    title: 'Plan Free',
    description: 'Ideal para comenzar. Acceso básico a la plataforma sin costo.',
    full_description: 'Incluye 1 usuario, catálogo de hasta 20 productos y soporte por email.',
    price: 0,
    status: 'basic',
    is_free: true,
  },
  {
    title: 'Plan Premium',
    description: 'Para negocios en crecimiento. Más usuarios y funciones avanzadas.',
    full_description: 'Incluye hasta 10 usuarios, catálogo ilimitado, reportes y soporte prioritario.',
    price: 29,
    status: 'info',
    is_free: false,
  },
  {
    title: 'Plan Pro',
    description: 'Potencia tu negocio con integraciones y analytics en tiempo real.',
    full_description: 'Incluye hasta 25 usuarios, integraciones externas, analytics avanzado y soporte 24/7.',
    price: 59,
    status: 'warning',
    is_free: false,
  },
  {
    title: 'Plan Business',
    description: 'Solución empresarial completa sin límites para tu organización.',
    full_description: 'Usuarios ilimitados, API dedicada, manager de cuenta y SLA garantizado.',
    price: 99,
    status: 'danger',
    is_free: false,
  },
];

import * as Sentry from '@sentry/react-native';

/**
 * Crash and error reporting to Sentry, so a tester's crash reaches us
 * instead of vanishing. Off in development and whenever no DSN is
 * configured (EXPO_PUBLIC_SENTRY_DSN, set per build profile in eas.json).
 *
 * Privacy: users are identified only by their anonymous id; request bodies,
 * query strings and console breadcrumbs (which can echo CV or job text) are
 * never sent. Keep the privacy policy's Sentry section in step with this.
 */
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
export const errorReportingEnabled = Boolean(dsn) && !__DEV__;

function scrubEvent<T extends Sentry.ErrorEvent>(event: T): T {
  if (event.request) {
    delete event.request.data;
    delete event.request.cookies;
    delete event.request.query_string;
    if (event.request.url) event.request.url = event.request.url.split('?')[0];
  }
  event.user = event.user?.id ? { id: event.user.id } : undefined;
  return event;
}

export function initErrorReporting() {
  if (!errorReportingEnabled) return;
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend: scrubEvent,
    beforeBreadcrumb: (breadcrumb) => {
      if (breadcrumb.category === 'console') return null;
      if (breadcrumb.data?.url && typeof breadcrumb.data.url === 'string') {
        breadcrumb.data.url = breadcrumb.data.url.split('?')[0];
      }
      return breadcrumb;
    },
  });
}

export function reportError(error: unknown) {
  if (errorReportingEnabled) Sentry.captureException(error);
}

export function setErrorReportingUser(userId: string | null) {
  if (errorReportingEnabled) Sentry.setUser(userId ? { id: userId } : null);
}

export function wrapRoot<P extends Record<string, unknown>>(component: React.ComponentType<P>) {
  return errorReportingEnabled ? Sentry.wrap(component) : component;
}

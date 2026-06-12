import type { ComponentType } from 'react';
import * as Sentry from '@sentry/react-native';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry(): void {
  if (!sentryDsn) {
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    debug: __DEV__,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: 0.2,
  });
}

export function wrapWithSentry<T extends ComponentType>(component: T): T {
  if (!sentryDsn) {
    return component;
  }
  return Sentry.wrap(component) as T;
}

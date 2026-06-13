import type { ComponentType } from 'react';
import { isRunningInExpoGo } from 'expo';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

function isSentryEnabled(): boolean {
  return Boolean(sentryDsn) && !isRunningInExpoGo();
}

export function initSentry(): void {
  if (!isSentryEnabled()) {
    return;
  }

  // Lazy-load: @sentry/react-native native bindings crash Expo Go at import time.
  const Sentry = require('@sentry/react-native') as typeof import('@sentry/react-native');
  Sentry.init({
    dsn: sentryDsn,
    debug: __DEV__,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: 0.2,
  });
}

export function wrapWithSentry<T extends ComponentType>(component: T): T {
  if (!isSentryEnabled()) {
    return component;
  }

  const Sentry = require('@sentry/react-native') as typeof import('@sentry/react-native');
  return Sentry.wrap(component) as T;
}

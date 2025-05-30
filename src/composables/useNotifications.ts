import { useQuasar, type QNotifyCreateOptions } from 'quasar'
import { useI18n } from 'vue-i18n'

export interface NotificationOptions {
  timeout?: number
  multiLine?: boolean
  progress?: boolean
}

export function useNotifications() {
  const $q = useQuasar()
  const { t } = useI18n()

  const getPosition = (type: string): 'top' | 'bottom' => {
    // Mobile-friendly positioning
    switch (type) {
      case 'negative': // Errors
      case 'warning': // Warnings
        return 'top'
      case 'positive': // Success
      case 'info': // Info
      default:
        return 'bottom'
    }
  }

  const showNotification = (
    messageKey: string,
    type: 'positive' | 'negative' | 'warning' | 'info' = 'info',
    params?: Record<string, string | number>,
    options?: NotificationOptions,
  ) => {
    const notifyOptions: QNotifyCreateOptions = {
      message: params ? t(messageKey, params) : t(messageKey),
      type,
      position: getPosition(type),
      progress: options?.progress ?? true,
      actions: [{ icon: 'close', color: 'white' }],
    }

    if (options?.timeout !== undefined) {
      notifyOptions.timeout = options.timeout
    }

    if (options?.multiLine !== undefined) {
      notifyOptions.multiLine = options.multiLine
    }

    $q.notify(notifyOptions)
  }

  // Convenience methods
  const showSuccess = (
    messageKey: string,
    params?: Record<string, string | number>,
    options?: NotificationOptions,
  ) => {
    showNotification(messageKey, 'positive', params, options)
  }

  const showError = (
    messageKey: string,
    params?: Record<string, string | number>,
    options?: NotificationOptions,
  ) => {
    showNotification(messageKey, 'negative', params, options)
  }

  const showWarning = (
    messageKey: string,
    params?: Record<string, string | number>,
    options?: NotificationOptions,
  ) => {
    showNotification(messageKey, 'warning', params, options)
  }

  const showInfo = (
    messageKey: string,
    params?: Record<string, string | number>,
    options?: NotificationOptions,
  ) => {
    showNotification(messageKey, 'info', params, options)
  }

  return {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  }
}

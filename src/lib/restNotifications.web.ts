// Na web não há notificação agendada: o timer da tela de treino continua sendo o único aviso.

export function setRestTimerOnScreen(_v: boolean) {}

export function startRestNotifications(): () => void {
  return () => {};
}

export async function exactAlarmGranted(): Promise<boolean> {
  return true;
}

export async function requestExactAlarm(): Promise<boolean> {
  return true;
}

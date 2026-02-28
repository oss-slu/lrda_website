let _shuttingDown = false;

export function setShuttingDown(value: boolean): void {
  _shuttingDown = value;
}

export function isShuttingDown(): boolean {
  return _shuttingDown;
}

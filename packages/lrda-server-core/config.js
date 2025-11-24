let cfg = {};

export function setConfig(newCfg = {}) {
  cfg = { ...cfg, ...newCfg };
}

export function getConfig() {
  return cfg;
}

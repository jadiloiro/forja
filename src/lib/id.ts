let counter = 0;

export function uid(): string {
  counter = (counter + 1) % 1e6;
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}${counter.toString(36)}`;
}

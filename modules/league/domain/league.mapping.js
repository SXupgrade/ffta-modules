export function createGroupKey(item) {
  return `${item.division || ''}${item.className || ''}`;
}

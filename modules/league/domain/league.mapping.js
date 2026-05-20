export function createGroupKey(item) {
  if (item?.categoryKey) {
    return item.categoryKey;
  }
  // League categories are class + division: H + CL = HCL.
  return `${item?.className || ''}${item?.division || ''}`;
}

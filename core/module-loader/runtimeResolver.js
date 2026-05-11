export function assertRuntimeCompatibility(manifest, runtimeType) {
  if (!manifest.runtimeCompatibility?.includes(runtimeType)) {
    throw new Error(`Module ${manifest.id} is not compatible with runtime ${runtimeType}`);
  }
}

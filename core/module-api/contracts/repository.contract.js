/**
 * Repository contracts are module-specific.
 * They must return normalized domain inputs and never leak raw SQL rows to domain code.
 */
export function assertRepositoryMethod(repository, methodName) {
  if (!repository || typeof repository[methodName] !== 'function') {
    throw new Error(`Repository is missing required method: ${methodName}`);
  }
}

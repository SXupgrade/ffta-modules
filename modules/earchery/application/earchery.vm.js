import { calculateAccuracy, createInitialGameState, registerShot, startGame, updateTarget } from '../domain/earchery.game.js';

export function createEArcheryViewModel({ app, store }) {
  const state = store.getState();
  state.__store = store;
  let lastTick = 0;

  function sync() {
    Object.assign(state, store.getState(), { __store: store });
  }

  store.subscribe(sync);

  function start() {
    const current = store.getState();
    store.setState({ ...startGame(current), bestScore: current.bestScore, error: null });
    lastTick = performanceNow();
  }

  function reset() {
    const current = store.getState();
    store.setState({ ...createInitialGameState(), bestScore: current.bestScore, error: null });
  }

  function tick() {
    const current = store.getState();
    if (current.status !== 'running') return null;
    const now = performanceNow();
    const delta = lastTick ? (now - lastTick) / 1000 : 0.016;
    lastTick = now;
    const target = updateTarget(current.target, current.arena, delta);
    store.setState({ target }, { silent: true });
    sync();
    return target;
  }

  function shoot(impact) {
    const current = store.getState();
    const next = registerShot(current, impact);
    const bestScore = Math.max(current.bestScore || 0, next.score || 0);
    store.setState({ ...next, bestScore });
  }

  function resizeArena(arena) {
    const current = store.getState();
    if (!arena?.width || !arena?.height) return;
    const width = Math.round(arena.width);
    const height = Math.round(arena.height);
    if (Math.abs((current.arena?.width || 0) - width) < 2 && Math.abs((current.arena?.height || 0) - height) < 2) {
      return;
    }
    const target = {
      ...current.target,
      x: Math.min(Math.max(current.target.x, current.target.radius), width - current.target.radius),
      y: Math.min(Math.max(current.target.y, current.target.radius), height - current.target.radius)
    };
    store.setState({ arena: { width, height }, target });
  }

  function getAccuracy() {
    return calculateAccuracy(store.getState());
  }

  function getMessage() {
    const key = store.getState().messageKey || 'messages.ready';
    return app.t(`earchery.${key}`);
  }

  return { state, start, reset, tick, shoot, resizeArena, getAccuracy, getMessage };
}

function performanceNow() {
  return globalThis.performance?.now ? globalThis.performance.now() : Date.now();
}

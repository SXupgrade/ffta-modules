export const DEFAULT_ARENA = Object.freeze({ width: 720, height: 420 });
export const DEFAULT_TARGET = Object.freeze({ x: 360, y: 210, radius: 72, vx: 150, vy: 96 });
export const MAX_SHOTS = 12;

export function createInitialGameState() {
  return {
    status: 'idle',
    arena: { ...DEFAULT_ARENA },
    target: { ...DEFAULT_TARGET },
    score: 0,
    shots: [],
    remainingShots: MAX_SHOTS,
    bestShot: null,
    messageKey: 'messages.ready'
  };
}

export function startGame(state = createInitialGameState()) {
  return {
    ...state,
    status: 'running',
    score: 0,
    shots: [],
    remainingShots: MAX_SHOTS,
    bestShot: null,
    target: { ...DEFAULT_TARGET },
    messageKey: 'messages.running'
  };
}

export function updateTarget(target, arena, deltaSeconds) {
  const safeDelta = Math.max(0, Math.min(Number(deltaSeconds) || 0, 0.08));
  const radius = target.radius;
  let x = target.x + target.vx * safeDelta;
  let y = target.y + target.vy * safeDelta;
  let vx = target.vx;
  let vy = target.vy;

  if (x < radius) {
    x = radius;
    vx = Math.abs(vx);
  } else if (x > arena.width - radius) {
    x = arena.width - radius;
    vx = -Math.abs(vx);
  }

  if (y < radius) {
    y = radius;
    vy = Math.abs(vy);
  } else if (y > arena.height - radius) {
    y = arena.height - radius;
    vy = -Math.abs(vy);
  }

  return { ...target, x, y, vx, vy };
}

export function scoreImpact({ x, y }, target) {
  const dx = x - target.x;
  const dy = y - target.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const ratio = distance / target.radius;

  if (ratio <= 0.18) return { points: 10, label: 'X', distance, ratio };
  if (ratio <= 0.33) return { points: 9, label: '9', distance, ratio };
  if (ratio <= 0.48) return { points: 8, label: '8', distance, ratio };
  if (ratio <= 0.63) return { points: 7, label: '7', distance, ratio };
  if (ratio <= 0.78) return { points: 6, label: '6', distance, ratio };
  if (ratio <= 0.93) return { points: 5, label: '5', distance, ratio };
  if (ratio <= 1) return { points: 4, label: '4', distance, ratio };
  return { points: 0, label: 'M', distance, ratio };
}

export function registerShot(state, impact) {
  if (state.status !== 'running' || state.remainingShots <= 0) return state;

  const scoring = scoreImpact(impact, state.target);
  const shot = {
    id: `shot-${state.shots.length + 1}`,
    number: state.shots.length + 1,
    x: round(impact.x),
    y: round(impact.y),
    targetX: round(state.target.x),
    targetY: round(state.target.y),
    points: scoring.points,
    label: scoring.label,
    distance: round(scoring.distance),
    createdAt: new Date().toISOString()
  };
  const shots = [...state.shots, shot];
  const remainingShots = Math.max(0, MAX_SHOTS - shots.length);
  const score = state.score + scoring.points;
  const bestShot = !state.bestShot || shot.points > state.bestShot.points || (shot.points === state.bestShot.points && shot.distance < state.bestShot.distance)
    ? shot
    : state.bestShot;

  return {
    ...state,
    shots,
    remainingShots,
    score,
    bestShot,
    status: remainingShots === 0 ? 'finished' : 'running',
    messageKey: remainingShots === 0 ? 'messages.finished' : getShotMessageKey(scoring.points)
  };
}

export function calculateAccuracy(state) {
  if (!state.shots.length) return 0;
  const hits = state.shots.filter((shot) => shot.points > 0).length;
  return Math.round((hits / state.shots.length) * 100);
}

function getShotMessageKey(points) {
  if (points >= 10) return 'messages.perfect';
  if (points >= 8) return 'messages.good';
  if (points > 0) return 'messages.hit';
  return 'messages.miss';
}

function round(value) {
  return Math.round(value * 100) / 100;
}

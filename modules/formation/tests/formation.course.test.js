import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { FORMATION_COURSE } from '../data/formation.course.js';
import { createFormationCourse, FORMATION_STEP_COLUMNS, parseFormationStepsCsv } from '../domain/formation.steps.js';

test('formation CSV exposes the expected editable Excel columns', () => {
  const csv = readFileSync(new URL('../data/formation.steps.csv', import.meta.url), 'utf8');
  const [firstStep] = parseFormationStepsCsv(csv);
  const header = FORMATION_STEP_COLUMNS.filter((column) => Object.prototype.hasOwnProperty.call(firstStep, column));

  assert.deepEqual(header, FORMATION_STEP_COLUMNS);
});

test('formation course is built from tabular step rows', () => {
  assert.equal(FORMATION_COURSE.lessons.length, 12);

  for (const lesson of FORMATION_COURSE.lessons) {
    assert.ok(lesson.stepId);
    assert.ok(lesson.title);
    assert.ok(lesson.objectives);
    assert.ok(lesson.learningText);
    assert.ok(Array.isArray(lesson.images));
    assert.equal(typeof lesson.hasImages, 'boolean');
    assert.equal(typeof lesson.hasExercise, 'boolean');
    assert.equal(typeof lesson.canInitExercise, 'boolean');
    assert.equal(typeof lesson.canVerifyExercise, 'boolean');
  }
});

test('empty exercise columns hide exercise actions', () => {
  const course = createFormationCourse(parseFormationStepsCsv(`stepId,title,objectives,learningText,images,exercise,scriptInitExercise,scriptVerifExercise
intro,Intro,Objective,Text,,,,active_tournament`));
  const lesson = course.lessons[0];

  assert.equal(lesson.hasExercise, false);
  assert.equal(lesson.canInitExercise, false);
  assert.equal(lesson.canVerifyExercise, true);
});

test('image column parses comma separated image filenames', () => {
  const course = createFormationCourse(parseFormationStepsCsv(`stepId,title,objectives,learningText,images,exercise,scriptInitExercise,scriptVerifExercise
intro,Intro,Objective,Text,"step1_image1.jpg, foo.jpg, bar.jpg",,,active_tournament`));
  const lesson = course.lessons[0];

  assert.equal(lesson.hasImages, true);
  assert.deepEqual(lesson.images, ['step1_image1.jpg', 'foo.jpg', 'bar.jpg']);
});

test('CSV parser supports French semicolon separator', () => {
  const course = createFormationCourse(parseFormationStepsCsv(`stepId;title;objectives;learningText;images;exercise;scriptInitExercise;scriptVerifExercise
intro;Intro;Objective;Text;"step1_image1.jpg, foo.jpg";Exercise;seed;active_tournament`));
  const lesson = course.lessons[0];

  assert.equal(lesson.title, 'Intro');
  assert.equal(lesson.exercise, 'Exercise');
  assert.deepEqual(lesson.images, ['step1_image1.jpg', 'foo.jpg']);
  assert.equal(lesson.scriptVerifExercise, 'active_tournament');
});

test('CSV parser supports tab separator', () => {
  const course = createFormationCourse(parseFormationStepsCsv(`stepId\ttitle\tobjectives\tlearningText\timages\texercise\tscriptInitExercise\tscriptVerifExercise
intro\tIntro\tObjective\tText\timage.jpg\t\t\tactive_tournament`));
  const lesson = course.lessons[0];

  assert.equal(lesson.title, 'Intro');
  assert.deepEqual(lesson.images, ['image.jpg']);
});

test('image filenames are restricted to local data filenames', () => {
  const course = createFormationCourse(parseFormationStepsCsv(`stepId,title,objectives,learningText,images,exercise,scriptInitExercise,scriptVerifExercise
intro,Intro,Objective,Text,"ok.jpg, ../bad.jpg, nested/bad.jpg, .hidden.jpg, not an image",,,active_tournament`));
  const lesson = course.lessons[0];

  assert.deepEqual(lesson.images, ['ok.jpg']);
});

test('semicolon CSV keeps comma text in the right columns', () => {
  const lesson = FORMATION_COURSE.lessons.find((item) => item.stepId === '3');

  assert.equal(lesson.objectives, 'Creer une competition de formation avec un code,  un nom,  un lieu et des dates coherentes.');
  assert.deepEqual(lesson.images, []);
  assert.equal(lesson.scriptInitExercise, 'tournament_identity');
  assert.equal(lesson.scriptVerifExercise, 'tournament_identity');
});

test('wrong target step maps to init and verification scripts', () => {
  const lesson = FORMATION_COURSE.lessons.find((item) => item.stepId === '9');

  assert.equal(lesson.scriptInitExercise, 'wrong_target');
  assert.equal(lesson.scriptVerifExercise, 'target_case_fixed');
});

test('script registry lives in data and defines init/check scripts', () => {
  const scripts = JSON.parse(readFileSync(new URL('../data/formation.scripts.json', import.meta.url), 'utf8'));

  assert.ok(scripts.initScripts.wrong_target);
  assert.ok(scripts.initScripts.wrong_target.actions.some((action) => action.type === 'runInitScript' && action.scriptId === 'participants'));
  assert.ok(scripts.initScripts.wrong_target.actions.some((action) => action.type === 'upsertQualification'));
  assert.ok(scripts.checkScripts.target_case_fixed);
  assert.ok(scripts.checkScripts.target_case_fixed.checks.some((check) => check.type === 'count' && check.join === 'Entries'));
});

test('script registry uses reusable declarative action types', () => {
  const scripts = JSON.parse(readFileSync(new URL('../data/formation.scripts.json', import.meta.url), 'utf8'));
  const actionTypes = new Set(Object.values(scripts.initScripts).flatMap((script) => script.actions.map((action) => action.type)));

  assert.ok(actionTypes.has('updateTournament'));
  assert.ok(actionTypes.has('upsertCountry'));
  assert.ok(actionTypes.has('upsertSession'));
  assert.ok(actionTypes.has('upsertEntry'));
  assert.ok(actionTypes.has('upsertQualification'));
});

test('script registry uses reusable declarative check types', () => {
  const scripts = JSON.parse(readFileSync(new URL('../data/formation.scripts.json', import.meta.url), 'utf8'));
  const checkTypes = new Set(Object.values(scripts.checkScripts).flatMap((script) => script.checks.map((check) => check.type)));

  assert.ok(checkTypes.has('activeTournament'));
  assert.ok(checkTypes.has('fieldNotEmpty'));
  assert.ok(checkTypes.has('fieldContains'));
  assert.ok(checkTypes.has('count'));
  assert.ok(checkTypes.has('or'));
});

test('participant scripts include extended entry and qualification fields', () => {
  const scripts = JSON.parse(readFileSync(new URL('../data/formation.scripts.json', import.meta.url), 'utf8'));
  const club = scripts.initScripts.participants.actions.find((action) => action.type === 'upsertCountry' && action.match.CoCode === 'FFTA');
  const camilleEntry = scripts.initScripts.participants.actions.find((action) => action.type === 'upsertEntry' && action.match.EnCode === '1000123A');
  const camilleQualification = scripts.initScripts.participants.actions.find((action) => action.type === 'upsertQualification' && action.entryCode === '1000123A');

  assert.equal(club.values.CoNameComplete, 'Club Formation FFTA');
  assert.deepEqual(camilleEntry.values.EnCountry, { ref: 'country:FFTA' });
  assert.equal(camilleEntry.values.EnAgeClass, 'S1F');
  assert.equal(camilleEntry.values.EnIocCode, 'FRA');
  assert.equal(camilleEntry.values.EnDob, '2000-01-02');
  assert.equal(camilleEntry.values.EnSex, 1);
  assert.equal(camilleEntry.values.EnTargetFace, 1);
  assert.equal(camilleQualification.values.QuTarget, '2');
  assert.equal(camilleQualification.values.QuLetter, 'A');
  assert.equal(camilleQualification.values.QuTargetNo, '2002A');
});

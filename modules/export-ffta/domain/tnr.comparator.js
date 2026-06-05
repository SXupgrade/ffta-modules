export function compareText({ expected, generated, expectedFile = '', generatedFile = '' }) {
  const normalizedExpected = normalizeText(expected);
  const normalizedGenerated = normalizeText(generated);
  const expectedLines = normalizedExpected.split('\n');
  const generatedLines = normalizedGenerated.split('\n');
  const max = Math.max(expectedLines.length, generatedLines.length);
  let firstDifference = null;

  for (let i = 0; i < max; i += 1) {
    if ((expectedLines[i] ?? '') !== (generatedLines[i] ?? '')) {
      firstDifference = { line: i + 1, expected: expectedLines[i] ?? '', generated: generatedLines[i] ?? '' };
      break;
    }
  }

  return {
    success: firstDifference === null,
    expectedFile,
    generatedFile,
    expectedLineCount: expectedLines.length,
    generatedLineCount: generatedLines.length,
    firstDifference
  };
}

function normalizeText(value) {
  return String(value ?? '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n$/, '');
}

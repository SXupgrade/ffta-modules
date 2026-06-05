export function renderTxt(lines) {
  return `${lines.map((line) => line.join('\t')).join('\r\n')}\r\n`;
}

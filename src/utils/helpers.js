export function parseNumberFromClueId(clueId) {
  return clueId.match(/^\d+/)[0];
}
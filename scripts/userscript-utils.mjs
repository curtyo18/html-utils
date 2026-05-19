export function parseUserscriptMeta(script) {
  const m = script.match(/\/\/ ==UserScript==([\s\S]*?)\/\/ ==\/UserScript==/);
  if (!m) return null;
  const result = {};
  for (const line of m[1].split(/\r?\n/)) {
    const pair = line.match(/^\/\/ @(\S+)[ \t]+(.*)/);
    if (pair) {
      const [, key, val] = pair;
      if (!(key in result)) result[key] = val.trim();
    }
  }
  return Object.keys(result).length ? result : null;
}

export function isShareUrlTooLong(compressed, baseUrl) {
  return (baseUrl + '?s=' + compressed).length > 8000;
}

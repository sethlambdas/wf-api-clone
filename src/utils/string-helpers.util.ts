export function replaceAt(text: string, index: number, lastIndex: number, replacement: string) {
  if (index >= text.length || index >= lastIndex || lastIndex > text.length) {
    return text.valueOf();
  }
  return text.substring(0, index) + replacement + text.substring(lastIndex);
}

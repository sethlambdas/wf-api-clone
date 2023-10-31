import { get } from 'lodash';
import { Logger as logger } from '@nestjs/common';

const credentials: string[] = ['accessToken', 'clientId', 'clientSecret', 'username', 'password'];

export function replaceAt(text: string, index: number, lastIndex: number, replacement: string) {
  if (index >= text.length || index >= lastIndex || lastIndex > text.length) {
    return text.valueOf();
  }
  return text.substring(0, index) + replacement + text.substring(lastIndex);
}

export function getMentionedData(unresolvedString: string, state?: any) {
  const regexBrackets = /{{(.*?)}}/g;
  let resolvedString = unresolvedString;

  resolvedString = resolvedString.replace(regexBrackets, (match, word) => {
    const trimWord = word.trim();
    let replacement: any;

    if (credentials.includes(trimWord)) {
      replacement = `{{${word}}}`;
    } else {
      replacement = get(state, trimWord);
    }

    return typeof replacement === 'object' ? JSON.stringify(replacement) : replacement;
  });

  return resolvedString;
}


export function resolveMentionDataFromMatchingData(unresolvedString: string, state?: any) {
  const regexBrackets = /{{(.*?)}}/gm;
  let resolvedString = unresolvedString;
  while (true) {
    const match = regexBrackets.exec(resolvedString);
    if (!match) break;

    const { 0: origWord, 1: word, index } = match;
    const lastIndex = index + origWord.length;
    const trimWord = word.trim();

    let replacement: any;

    if (credentials.includes(trimWord)) replacement = `{{${word}}}`;
    else replacement = get(state, trimWord);

    resolvedString = replaceAt(
      resolvedString,
      index,
      lastIndex,
      typeof replacement === 'object' ? JSON.stringify(replacement) : replacement,
    );
  }
  resolvedString = `[${resolvedString}]`;

  logger.log('RESOLVED STRING - MATCH DATA');
  logger.log(resolvedString);

  return resolvedString;
}

export function resolveValueOfVariableFromState(variable: string, state?: any) {
  const regexBrackets = /{{(.*?)}}/gm;
  let resolveVariable = variable;

  const match = regexBrackets.exec(resolveVariable);

  if (!match) return resolveVariable;

  const { 0: origWord, 1: word, index } = match;
  const trimWord = word.trim();

  let replacement: any;

  if (credentials.includes(trimWord)) replacement = `{{${word}}}`;
  else replacement = get(state, trimWord);

  logger.log('RESOLVED VARIABLE');
  logger.log(replacement);
  logger.log(typeof replacement);

  return replacement;
}

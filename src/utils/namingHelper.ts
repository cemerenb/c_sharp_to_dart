export function toCamelCase(input?: string | null): string {
  if (!input || !input.trim()) {
    return '';
  }

  let trimmed = input.trim();
  // Strip leading and trailing underscores
  trimmed = trimmed.replace(/^_+|_+$/g, '');
  if (!trimmed) {
    return input.toLowerCase();
  }

  // Split into raw parts by underscores, spaces, hyphens
  const rawParts = trimmed.split(/[\s_\-]+/).filter(Boolean);
  const words: string[] = [];

  for (const part of rawParts) {
    if (isAllUpper(part)) {
      words.push(part);
    } else {
      // Split PascalCase or mixed acronyms like APIClient into ["API", "Client"]
      // Regex splits between lowercase/digit and uppercase, or between uppercase sequence and uppercase+lowercase
      const subWords = part.split(/(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z]+)(?=[A-Z][a-z])/).filter(Boolean);
      words.push(...subWords);
    }
  }

  if (words.length === 0) {
    return trimmed.toLowerCase();
  }

  let result = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    if (i === 0) {
      if (isAllUpper(word)) {
        result += word.toLowerCase();
      } else {
        result += word[0].toLowerCase() + word.slice(1);
      }
    } else {
      if (isAllUpper(word)) {
        result += word[0].toUpperCase() + word.slice(1).toLowerCase();
      } else {
        result += word[0].toUpperCase() + word.slice(1);
      }
    }
  }

  return result;
}

function isAllUpper(str: string): boolean {
  if (!str) return false;
  let hasLetter = false;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // if lowercase a-z
    if (code >= 97 && code <= 122) {
      return false;
    }
    // if uppercase A-Z
    if (code >= 65 && code <= 90) {
      hasLetter = true;
    }
  }
  return hasLetter;
}

import { CSharpModel, CSharpProperty, ParseResult } from '../models/types';

export class CSharpParser {
  /**
   * Parses C# code and returns the first or specified C# class model.
   * If caretOffset is provided, it tries to find the class enclosing that offset.
   */
  public parse(csharpCode: string, caretOffset: number = -1): ParseResult {
    if (!csharpCode || !csharpCode.trim()) {
      return { success: false, errorMessage: 'C# code is empty.' };
    }

    // Strip comments while preserving character count/offsets if possible
    const cleanCode = this.removeComments(csharpCode);

    const classMatches = this.findClasses(cleanCode);

    if (classMatches.length === 0) {
      return { success: false, errorMessage: 'No C# class declaration found in the provided code.' };
    }

    let targetClass = classMatches[0];

    // If caretOffset is provided and valid, find the class that contains this offset
    if (caretOffset >= 0) {
      const enclosing = classMatches.filter(
        c => caretOffset >= c.startIndex && caretOffset <= c.endIndex
      );
      if (enclosing.length > 0) {
        // Innermost class (nested)
        targetClass = enclosing[enclosing.length - 1];
      }
    }

    const properties = this.extractProperties(targetClass.body);

    if (properties.length === 0) {
      return {
        success: false,
        errorMessage: `Class '${targetClass.name}' has no readable properties.`,
      };
    }

    const model: CSharpModel = {
      name: targetClass.name,
      modifiers: targetClass.modifiers,
      genericArguments: targetClass.genericArguments,
      properties,
      isGeneric: targetClass.genericArguments.length > 0,
    };

    return { success: true, model };
  }

  private removeComments(code: string): string {
    // Replace block comments with spaces to preserve line offsets
    let result = code.replace(/\/\*[\s\S]*?\*\//g, match => ' '.repeat(match.length));
    // Replace line comments with spaces
    result = result.replace(/\/\/[^\r\n]*/g, match => ' '.repeat(match.length));
    return result;
  }

  private findClasses(code: string): Array<{
    name: string;
    modifiers: string[];
    genericArguments: string[];
    body: string;
    startIndex: number;
    endIndex: number;
  }> {
    const classes: Array<{
      name: string;
      modifiers: string[];
      genericArguments: string[];
      body: string;
      startIndex: number;
      endIndex: number;
    }> = [];

    // Match class header: [modifiers] class ClassName[<T>]
    const classHeaderRegex =
      /(?:((?:public|internal|private|protected|partial|sealed|abstract|static)\s+)*)class\s+([A-Za-z0-9_]+)(?:\s*<([A-Za-z0-9_,\s]+)>)?/g;

    let match: RegExpExecArray | null;

    while ((match = classHeaderRegex.exec(code)) !== null) {
      const fullHeader = match[0];
      const modifiersStr = match[1] || '';
      const className = match[2];
      const genericStr = match[3] || '';
      const startIndex = match.index;

      const modifiers = modifiersStr.split(/\s+/).filter(Boolean);
      const genericArguments = genericStr
        ? genericStr.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      // Find opening brace '{'
      const openBraceIndex = code.indexOf('{', startIndex + fullHeader.length);
      if (openBraceIndex === -1) {
        continue;
      }

      // Balance braces to find matching '}'
      let braceCount = 1;
      let i = openBraceIndex + 1;
      while (i < code.length && braceCount > 0) {
        const char = code[i];
        if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
        }
        i++;
      }

      if (braceCount === 0) {
        const endIndex = i;
        const body = code.substring(openBraceIndex + 1, endIndex - 1);
        classes.push({
          name: className,
          modifiers,
          genericArguments,
          body,
          startIndex,
          endIndex,
        });
      }
    }

    return classes;
  }

  private extractProperties(classBody: string): CSharpProperty[] {
    const properties: CSharpProperty[] = [];

    // Regex to match C# properties with attributes and get/set accessors or expression bodies
    // Note: It ensures the identifier is NOT followed by '(' to avoid matching methods
    const propRegex =
      /((?:\[[^\]]+\]\s*)*)(?:(?:public|internal|protected|private|static|virtual|override|new|required)\s+)*([A-Za-z0-9_<>?,\[\]\s.]+?)\s+([A-Za-z0-9_]+)\s*(?:\{\s*([^}]+?)\s*\}|=>\s*([^;]+?);)/g;

    let match: RegExpExecArray | null;

    while ((match = propRegex.exec(classBody)) !== null) {
      const attributesRaw = match[1] || '';
      let rawType = match[2].trim();
      const propName = match[3].trim();
      const accessors = match[4] || '';
      const expressionBody = match[5] || '';

      // Strip any modifiers that might have been matched as part of type
      rawType = rawType
        .replace(/^(?:(?:public|internal|protected|private|static|virtual|override|new|required|readonly)\s+)+/gi, '')
        .trim();

      // Skip constructors, methods or control structures
      if (
        propName === 'get' ||
        propName === 'set' ||
        propName === 'if' ||
        propName === 'for' ||
        propName === 'while' ||
        propName === 'return'
      ) {
        continue;
      }

      // Check if property is readable (has get accessor or expression body)
      const isReadable =
        Boolean(expressionBody) ||
        accessors.includes('get') ||
        (!accessors.includes('set') && accessors.trim().length === 0);

      if (!isReadable) {
        continue;
      }

      // Parse attributes
      const attributes: string[] = [];
      let explicitJsonKey: string | undefined;

      if (attributesRaw) {
        const attrMatches = attributesRaw.matchAll(/\[([A-Za-z0-9_]+)(?:\(([^)]*)\))?\]/g);
        for (const attrMatch of attrMatches) {
          const attrName = attrMatch[1];
          attributes.push(attrName);

          if (attrName === 'JsonPropertyName' || attrName === 'JsonProperty') {
            const arg = attrMatch[2];
            if (arg) {
              const strVal = arg.trim().replace(/^["']|["']$/g, '');
              if (strVal) {
                explicitJsonKey = strVal;
              }
            }
          }
        }
      }

      const isNullable =
        rawType.endsWith('?') ||
        rawType.startsWith('Nullable<');

      properties.push({
        name: propName,
        rawTypeName: rawType,
        isNullable,
        attributes,
        explicitJsonKey,
      });
    }

    return properties;
  }
}

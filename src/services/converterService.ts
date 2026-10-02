import { CSharpParser } from '../parser/csharpParser';
import { CSharpToDartTypeMapper } from '../mapper/typeMapper';
import { DartModelGenerator } from '../generator/dartGenerator';
import { ConversionResult } from '../models/types';

export class ConverterService {
  private parser = new CSharpParser();
  private mapper = new CSharpToDartTypeMapper();
  private generator = new DartModelGenerator();

  public convert(csharpCode: string, caretOffset: number = -1): ConversionResult {
    const parseResult = this.parser.parse(csharpCode, caretOffset);

    if (!parseResult.success || !parseResult.model) {
      return {
        success: false,
        errorMessage: parseResult.errorMessage || 'Failed to parse C# code.',
      };
    }

    try {
      const dartModel = this.mapper.mapModel(parseResult.model);
      const dartCode = this.generator.generate(dartModel);

      return {
        success: true,
        dartCode,
        className: parseResult.model.name,
      };
    } catch (err: any) {
      return {
        success: false,
        errorMessage: `Conversion error: ${err?.message || String(err)}`,
      };
    }
  }
}

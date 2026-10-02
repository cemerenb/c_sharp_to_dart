import { DartModel, DartProperty, DartTypeKind } from '../models/types';

export class DartModelGenerator {
  public generate(model: DartModel): string {
    const lines: string[] = [];

    const genericSuffix = model.isGeneric
      ? `<${model.genericArguments.join(', ')}>`
      : '';

    // Class header
    lines.push(`class ${model.className}${genericSuffix} {`);

    // Fields
    for (const prop of model.properties) {
      lines.push(`  final ${prop.dartTypeName} ${prop.dartName};`);
    }

    if (model.properties.length > 0) {
      lines.push('');
    }

    // Constructor (all named required parameters)
    lines.push(`  ${model.className}({`);
    for (const prop of model.properties) {
      lines.push(`    required this.${prop.dartName},`);
    }
    lines.push('  });');
    lines.push('');

    // factory fromJson
    if (model.isGeneric) {
      lines.push(`  factory ${model.className}.fromJson(`);
      lines.push('    Map<String, dynamic> json,');
      for (const gArg of model.genericArguments) {
        lines.push(`    ${gArg} Function(dynamic) fromJson${gArg},`);
      }
      lines.push('  ) {');
      lines.push(`    return ${model.className}(`);
      for (const prop of model.properties) {
        const expr = this.generateFromJsonExpression(prop);
        lines.push(`      ${prop.dartName}: ${expr},`);
      }
      lines.push('    );');
      lines.push('  }');
    } else {
      lines.push(`  factory ${model.className}.fromJson(Map<String, dynamic> json) {`);
      lines.push(`    return ${model.className}(`);
      for (const prop of model.properties) {
        const expr = this.generateFromJsonExpression(prop);
        lines.push(`      ${prop.dartName}: ${expr},`);
      }
      lines.push('    );');
      lines.push('  }');
    }

    lines.push('');

    // toJson
    if (model.isGeneric) {
      lines.push('  Map<String, dynamic> toJson(');
      for (const gArg of model.genericArguments) {
        lines.push(`    dynamic Function(${gArg}) toJson${gArg},`);
      }
      lines.push('  ) {');
      lines.push('    return {');
      for (const prop of model.properties) {
        const expr = this.generateToJsonExpression(prop);
        lines.push(`      '${prop.jsonKey}': ${expr},`);
      }
      lines.push('    };');
      lines.push('  }');
    } else {
      lines.push('  Map<String, dynamic> toJson() {');
      lines.push('    return {');
      for (const prop of model.properties) {
        const expr = this.generateToJsonExpression(prop);
        lines.push(`      '${prop.jsonKey}': ${expr},`);
      }
      lines.push('    };');
      lines.push('  }');
    }

    lines.push('}');

    return lines.join('\n');
  }

  private generateFromJsonExpression(prop: DartProperty): string {
    const key = prop.jsonKey;

    if (prop.kind === DartTypeKind.GenericParameter) {
      const gName = prop.genericParameterName || prop.dartTypeName.replace(/\?$/, '');
      return `fromJson${gName}(json['${key}'])`;
    }

    if (prop.kind === DartTypeKind.DateTime) {
      if (prop.isNullable) {
        return `json['${key}'] != null\n          ? DateTime.tryParse(json['${key}'])\n          : null`;
      }
      return `DateTime.tryParse(json['${key}'] ?? '') ?? DateTime(1970)`;
    }

    if (prop.kind === DartTypeKind.CustomDto) {
      const cleanDtoName = prop.dartTypeName.replace(/\?$/, '');
      if (prop.isNullable) {
        return `json['${key}'] != null\n          ? ${cleanDtoName}.fromJson(json['${key}'])\n          : null`;
      }
      return `${cleanDtoName}.fromJson(json['${key}'] ?? {})`;
    }

    if (prop.kind === DartTypeKind.List) {
      const itemType = prop.itemTypeName || 'dynamic';
      if (prop.itemKind === DartTypeKind.CustomDto) {
        if (prop.isNullable) {
          return `(json['${key}'] as List<dynamic>?)\n              ?.map((e) => ${itemType}.fromJson(e))\n              .toList()`;
        }
        return `(json['${key}'] as List<dynamic>?)\n              ?.map((e) => ${itemType}.fromJson(e))\n              .toList() ??\n          []`;
      } else {
        if (prop.isNullable) {
          return `(json['${key}'] as List<dynamic>?)\n              ?.map((e) => e as ${itemType})\n              .toList()`;
        }
        return `(json['${key}'] as List<dynamic>?)\n              ?.map((e) => e as ${itemType})\n              .toList() ??\n          []`;
      }
    }

    if (prop.kind === DartTypeKind.Map) {
      const kType = prop.keyTypeName || 'String';
      const vType = prop.valueTypeName || 'dynamic';
      if (prop.isNullable) {
        return `json['${key}'] != null\n          ? Map<${kType}, ${vType}>.from(json['${key}'])\n          : null`;
      }
      return `json['${key}'] != null\n          ? Map<${kType}, ${vType}>.from(json['${key}'])\n          : {}`;
    }

    if (prop.isNullable) {
      return `json['${key}']`;
    }

    // Primitive non-nullable
    switch (prop.dartTypeName) {
      case 'int':
        return `json['${key}'] ?? 0`;
      case 'double':
        return `(json['${key}'] as num?)?.toDouble() ?? 0.0`;
      case 'String':
        return `json['${key}'] ?? ''`;
      case 'bool':
        return `json['${key}'] ?? false`;
      default:
        return `json['${key}']`;
    }
  }

  private generateToJsonExpression(prop: DartProperty): string {
    if (prop.kind === DartTypeKind.GenericParameter) {
      const gName = prop.genericParameterName || prop.dartTypeName.replace(/\?$/, '');
      return `toJson${gName}(${prop.dartName})`;
    }

    if (prop.kind === DartTypeKind.DateTime) {
      return prop.isNullable
        ? `${prop.dartName}?.toIso8601String()`
        : `${prop.dartName}.toIso8601String()`;
    }

    if (prop.kind === DartTypeKind.CustomDto) {
      return prop.isNullable
        ? `${prop.dartName}?.toJson()`
        : `${prop.dartName}.toJson()`;
    }

    if (prop.kind === DartTypeKind.List) {
      if (prop.itemKind === DartTypeKind.CustomDto) {
        return prop.isNullable
          ? `${prop.dartName}?.map((e) => e.toJson()).toList()`
          : `${prop.dartName}.map((e) => e.toJson()).toList()`;
      }
      return prop.dartName;
    }

    return prop.dartName;
  }
}

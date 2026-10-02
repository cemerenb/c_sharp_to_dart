import {
  CSharpModel,
  CSharpProperty,
  DartModel,
  DartProperty,
  DartTypeKind,
} from '../models/types';
import { toCamelCase } from '../utils/namingHelper';

export class CSharpToDartTypeMapper {
  private static readonly simpleTypeMap: Record<string, string> = {
    int: 'int',
    int32: 'int',
    long: 'int',
    int64: 'int',
    short: 'int',
    int16: 'int',
    byte: 'int',
    sbyte: 'int',
    uint: 'int',
    uint32: 'int',
    ulong: 'int',
    uint64: 'int',
    ushort: 'int',
    uint16: 'int',

    double: 'double',
    float: 'double',
    single: 'double',
    decimal: 'double',

    string: 'String',
    guid: 'String',

    bool: 'bool',
    boolean: 'bool',

    datetime: 'DateTime',
    datetimeoffset: 'DateTime',
    dateonly: 'DateTime',
    timeonly: 'DateTime',

    object: 'dynamic',
    dynamic: 'dynamic',
  };

  public mapModel(model: CSharpModel): DartModel {
    const dartProperties = model.properties.map(p =>
      this.mapProperty(p, model.genericArguments)
    );

    return {
      className: model.name,
      genericArguments: [...model.genericArguments],
      properties: dartProperties,
      isGeneric: model.isGeneric,
    };
  }

  public mapProperty(
    property: CSharpProperty,
    genericTypeParameters: string[] = []
  ): DartProperty {
    const rawType = property.rawTypeName.trim();
    const isNullable =
      property.isNullable ||
      rawType.endsWith('?') ||
      rawType.startsWith('Nullable<');

    const unwrappedType = this.unwrapNullable(rawType);
    const dartName = toCamelCase(property.name);
    const jsonKey = property.explicitJsonKey || dartName;

    const resolved = this.resolveDartType(
      unwrappedType,
      isNullable,
      genericTypeParameters
    );

    return {
      csharpName: property.name,
      dartName,
      jsonKey,
      dartTypeName: resolved.dartTypeName,
      isNullable: isNullable && resolved.dartTypeName !== 'dynamic',
      kind: resolved.kind,
      itemTypeName: resolved.itemTypeName,
      itemKind: resolved.itemKind,
      keyTypeName: resolved.keyTypeName,
      valueTypeName: resolved.valueTypeName,
      genericParameterName: resolved.genericParameterName,
    };
  }

  private resolveDartType(
    typeName: string,
    isNullable: boolean,
    genericTypeParameters: string[]
  ): {
    dartTypeName: string;
    kind: DartTypeKind;
    itemTypeName?: string;
    itemKind?: DartTypeKind;
    keyTypeName?: string;
    valueTypeName?: string;
    genericParameterName?: string;
  } {
    const cleanType = typeName.trim();

    // Check if generic type parameter (e.g. T)
    if (genericTypeParameters.includes(cleanType)) {
      const dtName = cleanType + (isNullable ? '?' : '');
      return {
        dartTypeName: dtName,
        kind: DartTypeKind.GenericParameter,
        genericParameterName: cleanType,
      };
    }

    // Check simple types
    const lowerKey = cleanType.toLowerCase();
    if (lowerKey in CSharpToDartTypeMapper.simpleTypeMap) {
      const mapped = CSharpToDartTypeMapper.simpleTypeMap[lowerKey];
      const dtName =
        mapped === 'dynamic' ? 'dynamic' : mapped + (isNullable ? '?' : '');

      let kind = DartTypeKind.Primitive;
      if (mapped === 'DateTime') {
        kind = DartTypeKind.DateTime;
      } else if (mapped === 'dynamic') {
        kind = DartTypeKind.Dynamic;
      }

      return {
        dartTypeName: dtName,
        kind,
      };
    }

    // Check array types: T[]
    if (cleanType.endsWith('[]')) {
      const elemType = cleanType.substring(0, cleanType.length - 2).trim();
      const elemInfo = this.resolveDartType(elemType, false, genericTypeParameters);
      const dtName = `List<${elemInfo.dartTypeName}>` + (isNullable ? '?' : '');
      return {
        dartTypeName: dtName,
        kind: DartTypeKind.List,
        itemTypeName: elemInfo.dartTypeName,
        itemKind: elemInfo.kind,
      };
    }

    // Check generic collections: List<T>, IList<T>, IEnumerable<T>, etc.
    const innerListType = this.getListInnerType(cleanType);
    if (innerListType) {
      const elemInfo = this.resolveDartType(
        innerListType,
        false,
        genericTypeParameters
      );
      const dtName = `List<${elemInfo.dartTypeName}>` + (isNullable ? '?' : '');
      return {
        dartTypeName: dtName,
        kind: DartTypeKind.List,
        itemTypeName: elemInfo.dartTypeName,
        itemKind: elemInfo.kind,
      };
    }

    // Check generic maps: Dictionary<K, V>, IDictionary<K, V>
    const mapTypes = this.getDictionaryTypes(cleanType);
    if (mapTypes) {
      const keyInfo = this.resolveDartType(
        mapTypes.keyType,
        false,
        genericTypeParameters
      );
      const valInfo = this.resolveDartType(
        mapTypes.valType,
        false,
        genericTypeParameters
      );
      const dtName =
        `Map<${keyInfo.dartTypeName}, ${valInfo.dartTypeName}>` +
        (isNullable ? '?' : '');
      return {
        dartTypeName: dtName,
        kind: DartTypeKind.Map,
        keyTypeName: keyInfo.dartTypeName,
        valueTypeName: valInfo.dartTypeName,
      };
    }

    // Otherwise treat as Custom DTO
    // Strip namespaces if present (e.g. MyNamespace.ProductDto -> ProductDto)
    let simpleName = cleanType;
    const lastDot = simpleName.lastIndexOf('.');
    if (lastDot >= 0 && lastDot < simpleName.length - 1) {
      simpleName = simpleName.substring(lastDot + 1);
    }

    const customType = simpleName + (isNullable ? '?' : '');
    return {
      dartTypeName: customType,
      kind: DartTypeKind.CustomDto,
    };
  }

  private unwrapNullable(rawType: string): string {
    let t = rawType.trim();
    if (t.endsWith('?')) {
      return t.substring(0, t.length - 1).trim();
    }
    if (t.toLowerCase().startsWith('nullable<') && t.endsWith('>')) {
      return t.substring(9, t.length - 1).trim();
    }
    return t;
  }

  private getListInnerType(typeName: string): string | null {
    const listPrefixes = [
      'List<',
      'IList<',
      'IEnumerable<',
      'ICollection<',
      'IReadOnlyList<',
      'IReadOnlyCollection<',
      'HashSet<',
      'ISet<',
    ];
    for (const prefix of listPrefixes) {
      if (
        typeName.toLowerCase().startsWith(prefix.toLowerCase()) &&
        typeName.endsWith('>')
      ) {
        return typeName.substring(prefix.length, typeName.length - 1).trim();
      }
    }
    return null;
  }

  private getDictionaryTypes(
    typeName: string
  ): { keyType: string; valType: string } | null {
    const dictPrefixes = [
      'Dictionary<',
      'IDictionary<',
      'IReadOnlyDictionary<',
    ];
    for (const prefix of dictPrefixes) {
      if (
        typeName.toLowerCase().startsWith(prefix.toLowerCase()) &&
        typeName.endsWith('>')
      ) {
        const inner = typeName.substring(prefix.length, typeName.length - 1).trim();
        const args = this.splitGenericArguments(inner);
        if (args.length === 2) {
          return { keyType: args[0], valType: args[1] };
        }
      }
    }
    return null;
  }

  private splitGenericArguments(inner: string): string[] {
    const results: string[] = [];
    let depth = 0;
    let start = 0;

    for (let i = 0; i < inner.length; i++) {
      const c = inner[i];
      if (c === '<') depth++;
      else if (c === '>') depth--;
      else if (c === ',' && depth === 0) {
        results.push(inner.substring(start, i).trim());
        start = i + 1;
      }
    }

    if (start < inner.length) {
      results.push(inner.substring(start).trim());
    }

    return results;
  }
}

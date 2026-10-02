export interface CSharpProperty {
  name: string;
  rawTypeName: string;
  isNullable: boolean;
  attributes: string[];
  explicitJsonKey?: string;
}

export interface CSharpModel {
  name: string;
  modifiers: string[];
  genericArguments: string[];
  properties: CSharpProperty[];
  isGeneric: boolean;
}

export enum DartTypeKind {
  Primitive = 'Primitive',
  DateTime = 'DateTime',
  Dynamic = 'Dynamic',
  CustomDto = 'CustomDto',
  List = 'List',
  Map = 'Map',
  GenericParameter = 'GenericParameter',
}

export interface DartProperty {
  csharpName: string;
  dartName: string;
  jsonKey: string;
  dartTypeName: string;
  isNullable: boolean;
  kind: DartTypeKind;
  itemTypeName?: string;
  itemKind?: DartTypeKind;
  keyTypeName?: string;
  valueTypeName?: string;
  genericParameterName?: string;
}

export interface DartModel {
  className: string;
  genericArguments: string[];
  properties: DartProperty[];
  isGeneric: boolean;
}

export interface ParseResult {
  success: boolean;
  errorMessage?: string;
  model?: CSharpModel;
}

export interface ConversionResult {
  success: boolean;
  dartCode?: string;
  className?: string;
  errorMessage?: string;
}

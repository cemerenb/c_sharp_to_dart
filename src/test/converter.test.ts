import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ConverterService } from '../services/converterService';
import { toCamelCase } from '../utils/namingHelper';

describe('NamingConventionHelper Tests', () => {
  it('converts PascalCase, snake_case, and acronyms correctly', () => {
    assert.strictEqual(toCamelCase('UserId'), 'userId');
    assert.strictEqual(toCamelCase('OrganizationId'), 'organizationId');
    assert.strictEqual(toCamelCase('GuidId'), 'guidId');
    assert.strictEqual(toCamelCase('Description'), 'description');
    assert.strictEqual(toCamelCase('Work_Order_Id'), 'workOrderId');
    assert.strictEqual(toCamelCase('Work_Order_No'), 'workOrderNo');
    assert.strictEqual(toCamelCase('Completed_Date'), 'completedDate');
    assert.strictEqual(toCamelCase('ITEM_ID'), 'itemId');
    assert.strictEqual(toCamelCase('URL'), 'url');
    assert.strictEqual(toCamelCase('APIClient'), 'apiClient');
    assert.strictEqual(toCamelCase('Id'), 'id');
    assert.strictEqual(toCamelCase('ID'), 'id');
    assert.strictEqual(toCamelCase('OrderId'), 'orderId');
  });

  it('handles empty and null values', () => {
    assert.strictEqual(toCamelCase(''), '');
    assert.strictEqual(toCamelCase('   '), '');
    assert.strictEqual(toCamelCase(null), '');
  });
});

describe('C# to Dart Converter Integration Tests (19 Scenarios)', () => {
  const converter = new ConverterService();

  function normalize(str: string): string {
    return str.replace(/\r\n/g, '\n').trim();
  }

  // 1. Basic DTO - Exact match test
  it('Scenario 1: Basic DTO exact match', () => {
    const csharp = `
public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public bool IsActive { get; set; }
}`;

    const expectedDart = `class UserDto {
  final int id;
  final String username;
  final String email;
  final bool isActive;

  UserDto({
    required this.id,
    required this.username,
    required this.email,
    required this.isActive,
  });

  factory UserDto.fromJson(Map<String, dynamic> json) {
    return UserDto(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      isActive: json['isActive'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'email': email,
      'isActive': isActive,
    };
  }
}`;

    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.strictEqual(normalize(result.dartCode!), normalize(expectedDart));
  });

  // 2. Nullable properties
  it('Scenario 2: Nullable properties', () => {
    const csharp = `
public class NullableSampleDto
{
    public int? ItemId { get; set; }
    public string? Name { get; set; }
}`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.match(result.dartCode!, /final int\? itemId;/);
    assert.match(result.dartCode!, /final String\? name;/);
    assert.match(result.dartCode!, /required this\.itemId,/);
    assert.match(result.dartCode!, /required this\.name,/);
    assert.match(result.dartCode!, /itemId: json\['itemId'\],/);
    assert.match(result.dartCode!, /name: json\['name'\],/);
  });

  // 3. String & Guid
  it('Scenario 3: String and Guid', () => {
    const csharp = `
public class StringGuidDto
{
    public string Name { get; set; }
    public Guid UniqueId { get; set; }
}`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.match(result.dartCode!, /final String name;/);
    assert.match(result.dartCode!, /final String uniqueId;/);
    assert.match(result.dartCode!, /name: json\['name'\] \?\? '',/);
    assert.match(result.dartCode!, /uniqueId: json\['uniqueId'\] \?\? '',/);
  });

  // 4. int, long, short, byte
  it('Scenario 4: Integer types', () => {
    const csharp = `
public class NumberDto
{
    public int IntVal { get; set; }
    public long LongVal { get; set; }
    public short ShortVal { get; set; }
    public byte ByteVal { get; set; }
}`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.match(result.dartCode!, /final int intVal;/);
    assert.match(result.dartCode!, /final int longVal;/);
    assert.match(result.dartCode!, /final int shortVal;/);
    assert.match(result.dartCode!, /final int byteVal;/);
    assert.match(result.dartCode!, /intVal: json\['intVal'\] \?\? 0,/);
    assert.match(result.dartCode!, /longVal: json\['longVal'\] \?\? 0,/);
  });

  // 5. double & float
  it('Scenario 5: Double and float', () => {
    const csharp = `
public class FloatDto
{
    public double Rate { get; set; }
    public float Ratio { get; set; }
}`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.match(result.dartCode!, /final double rate;/);
    assert.match(result.dartCode!, /final double ratio;/);
    assert.ok(result.dartCode!.includes("rate: (json['rate'] as num?)?.toDouble() ?? 0.0,"));
    assert.ok(result.dartCode!.includes("ratio: (json['ratio'] as num?)?.toDouble() ?? 0.0,"));
  });

  // 6. decimal
  it('Scenario 6: Decimal', () => {
    const csharp = `
public class MoneyDto
{
    public decimal Price { get; set; }
    public decimal? Discount { get; set; }
}`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.match(result.dartCode!, /final double price;/);
    assert.match(result.dartCode!, /final double\? discount;/);
    assert.ok(result.dartCode!.includes("price: (json['price'] as num?)?.toDouble() ?? 0.0,"));
    assert.match(result.dartCode!, /discount: json\['discount'\],/);
  });

  // 7. bool
  it('Scenario 7: Bool', () => {
    const csharp = `
public class StatusDto
{
    public bool IsActive { get; set; }
    public bool? IsDeleted { get; set; }
}`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.match(result.dartCode!, /final bool isActive;/);
    assert.match(result.dartCode!, /final bool\? isDeleted;/);
    assert.match(result.dartCode!, /isActive: json\['isActive'\] \?\? false,/);
    assert.match(result.dartCode!, /isDeleted: json\['isDeleted'\],/);
  });

  // 8. DateTime
  it('Scenario 8: DateTime non-nullable and nullable', () => {
    const csharp = `
public class DateDto
{
    public DateTime CreatedDate { get; set; }
    public DateTime? CompletedDate { get; set; }
}`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.match(result.dartCode!, /final DateTime createdDate;/);
    assert.match(result.dartCode!, /final DateTime\? completedDate;/);
    assert.match(result.dartCode!, /DateTime\.tryParse\(json\['createdDate'\] \?\? ''\) \?\? DateTime\(1970\)/);
    assert.match(result.dartCode!, /completedDate: json\['completedDate'\] != null/);
    assert.match(result.dartCode!, /'createdDate': createdDate\.toIso8601String\(\),/);
    assert.match(result.dartCode!, /'completedDate': completedDate\?\.toIso8601String\(\),/);
  });

  // 9. List<int>
  it('Scenario 9: List<int>', () => {
    const csharp = `
public class ListIntDto
{
    public List<int> ItemIds { get; set; }
}`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.match(result.dartCode!, /final List<int> itemIds;/);
    assert.match(result.dartCode!, /\(json\['itemIds'\] as List<dynamic>\?\)[\s\S]*\?\.map\(\(e\) => e as int\)[\s\S]*\.toList\(\) \?\?[\s\S]*\[\]/);
    assert.match(result.dartCode!, /'itemIds': itemIds,/);
  });

  // 10. List<string>
  it('Scenario 10: List<string>', () => {
    const csharp = `
public class TagsDto
{
    public List<string> Tags { get; set; }
}`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.match(result.dartCode!, /final List<String> tags;/);
    assert.match(result.dartCode!, /\?\.map\(\(e\) => e as String\)/);
  });

  // 11. List<CustomDto>
  it('Scenario 11: List<CustomDto>', () => {
    const csharp = `
public class OrderDto
{
    public List<ProductDto> Products { get; set; }
}`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.match(result.dartCode!, /final List<ProductDto> products;/);
    assert.match(result.dartCode!, /\?\.map\(\(e\) => ProductDto\.fromJson\(e\)\)/);
    assert.match(result.dartCode!, /'products': products\.map\(\(e\) => e\.toJson\(\)\)\.toList\(\),/);
  });

  // 12. CustomDto
  it('Scenario 12: CustomDto', () => {
    const csharp = `
public class OrderDto
{
    public ProductDto Product { get; set; }
}`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.match(result.dartCode!, /final ProductDto product;/);
    assert.match(result.dartCode!, /product: ProductDto\.fromJson\(json\['product'\] \?\? {}\),/);
    assert.match(result.dartCode!, /'product': product\.toJson\(\),/);
  });

  // 13. Nullable CustomDto
  it('Scenario 13: Nullable CustomDto', () => {
    const csharp = `
public class OrderDto
{
    public ProductDto? Product { get; set; }
}`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.match(result.dartCode!, /final ProductDto\? product;/);
    assert.match(result.dartCode!, /product: json\['product'\] != null/);
    assert.match(result.dartCode!, /ProductDto\.fromJson\(json\['product'\]\)/);
    assert.match(result.dartCode!, /'product': product\?\.toJson\(\),/);
  });

  // 14. Dictionary
  it('Scenario 14: Dictionary<string, string> and Dictionary<string, object>', () => {
    const csharp = `
public class ConfigDto
{
    public Dictionary<string, string> Headers { get; set; }
    public Dictionary<string, object> Metadata { get; set; }
}`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.match(result.dartCode!, /final Map<String, String> headers;/);
    assert.match(result.dartCode!, /final Map<String, dynamic> metadata;/);
    assert.match(result.dartCode!, /Map<String, String>\.from\(json\['headers'\]\)/);
    assert.match(result.dartCode!, /Map<String, dynamic>\.from\(json\['metadata'\]\)/);
  });

  // 15. Underscore property names
  it('Scenario 15: Underscore property names', () => {
    const csharp = `
public class UnderscoreDto
{
    public int Work_Order_Id { get; set; }
    public string Work_Order_No { get; set; }
    public DateTime Completed_Date { get; set; }
}`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.match(result.dartCode!, /final int workOrderId;/);
    assert.match(result.dartCode!, /final String workOrderNo;/);
    assert.match(result.dartCode!, /final DateTime completedDate;/);
    assert.match(result.dartCode!, /workOrderId: json\['workOrderId'\] \?\? 0,/);
    assert.match(result.dartCode!, /workOrderNo: json\['workOrderNo'\] \?\? '',/);
  });

  // 16. Multiple consecutive uppercase characters
  it('Scenario 16: Multiple consecutive uppercase characters', () => {
    const csharp = `
public class AcronymDto
{
    public int ITEM_ID { get; set; }
    public string URL { get; set; }
    public string APIClient { get; set; }
}`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.match(result.dartCode!, /final int itemId;/);
    assert.match(result.dartCode!, /final String url;/);
    assert.match(result.dartCode!, /final String apiClient;/);
    assert.match(result.dartCode!, /itemId: json\['itemId'\] \?\? 0,/);
    assert.match(result.dartCode!, /url: json\['url'\] \?\? '',/);
    assert.match(result.dartCode!, /apiClient: json\['apiClient'\] \?\? '',/);
  });

  // 17. Empty class error handling
  it('Scenario 17: Empty class returns friendly error', () => {
    const csharp = `public class EmptyDto { }`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, false);
    assert.match(result.errorMessage!, /has no readable properties/);
  });

  // 18. Invalid C# code returns error
  it('Scenario 18: No class found returns error', () => {
    const csharp = `// Just comments and no class`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, false);
    assert.match(result.errorMessage!, /No C# class declaration found/);
  });

  // 19. Generic model
  it('Scenario 19: Generic model ResponseDto<T>', () => {
    const csharp = `
public class ResponseDto<T>
{
    public T Data { get; set; }
}`;
    const result = converter.convert(csharp);
    assert.strictEqual(result.success, true);
    assert.match(result.dartCode!, /class ResponseDto<T> {/);
    assert.match(result.dartCode!, /final T data;/);
    assert.match(result.dartCode!, /ResponseDto\(\{/);
    assert.match(result.dartCode!, /required this\.data,/);
    assert.match(result.dartCode!, /factory ResponseDto\.fromJson\(/);
    assert.match(result.dartCode!, /T Function\(dynamic\) fromJsonT,/);
    assert.match(result.dartCode!, /data: fromJsonT\(json\['data'\]\),/);
    assert.match(result.dartCode!, /Map<String, dynamic> toJson\(/);
    assert.match(result.dartCode!, /dynamic Function\(T\) toJsonT,/);
    assert.match(result.dartCode!, /'data': toJsonT\(data\),/);
  });
});

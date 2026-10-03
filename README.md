# C# to Dart Model Generator

[![GitHub Repository](https://img.shields.io/badge/GitHub-c__sharp__to__dart-blue?logo=github)](https://github.com/cemerenb/c_sharp_to_dart)

Convert C# DTOs and model classes directly into clean, complete Dart classes with `fromJson` and `toJson` serialization in **Visual Studio Code**.

Easily copy a C# model from backend projects, Swagger, or web pages, and paste it as ready-to-use Dart code directly into your code editor.

---

## Features

* **Paste C# as Dart (`Ctrl + Alt + V` / `Cmd + Alt + V`)**: Detects C# code in your clipboard, converts it to a Dart model, and pastes it at your cursor position instantly.
* **Convert Selection**: Converts highlighted C# code directly in the active editor.
* **Context Menu Integration**: Right-click in the editor and choose **Paste C# as Dart**.
* **Complete Dart Code Generation**:
  - `final` fields
  - Named `required` parameters in constructor
  - Type-safe `factory Model.fromJson(Map<String, dynamic> json)`
  - `Map<String, dynamic> toJson()`
  - Generic support with `fromJsonT` and `toJsonT` for generic models like `ResponseDto<T>`
  - Full support for nullable types, lists, nested DTOs, dictionaries (`Map`), and `DateTime` parsing
  - Smart `camelCase` naming conventions for properties (handles underscores and acronyms properly)

---

## How to Use

1. Copy any C# class to your clipboard (`Ctrl + C` / `Cmd + C`).
2. Open your `.dart` file in Visual Studio Code.
3. Move the cursor to where you want to insert the model.
4. Paste using any of the following methods:
   - **Keyboard Shortcut**: `Ctrl + Alt + V` (macOS: `Cmd + Alt + V`)
   - **Right-Click Context Menu**: Right-click in the editor and select **Paste C# as Dart**.
   - **Command Palette**: Press `Ctrl + Shift + P` (macOS: `Cmd + Shift + P`) and type **Paste C# as Dart**.

---

## Example Conversion

### Input C# Code (Clipboard):
```csharp
public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public bool IsActive { get; set; }
}
```

### Generated Dart Code:
```dart
class UserDto {
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
}
```

---

## Supported C# → Dart Type Mappings

| C# Type | Dart Type | Default / Parsing Behavior |
| :--- | :--- | :--- |
| `int`, `long`, `short`, `byte` | `int` | `json['key'] ?? 0` |
| `double`, `float`, `decimal` | `double` | `(json['key'] as num?)?.toDouble() ?? 0.0` |
| `string`, `Guid` | `String` | `json['key'] ?? ''` |
| `bool` | `bool` | `json['key'] ?? false` |
| `DateTime`, `DateTimeOffset` | `DateTime` | `DateTime.tryParse(json['key'] ?? '') ?? DateTime(1970)` |
| `object`, `dynamic` | `dynamic` | `json['key']` |
| `int?`, `long?`, `short?`, `byte?` | `int?` | `json['key']` |
| `double?`, `float?`, `decimal?` | `double?` | `json['key']` |
| `string?`, `Guid?` | `String?` | `json['key']` |
| `bool?` | `bool?` | `json['key']` |
| `DateTime?` | `DateTime?` | `json['key'] != null ? DateTime.tryParse(json['key']) : null` |
| `ProductDto` (Custom DTO) | `ProductDto` | `ProductDto.fromJson(json['key'] ?? {})` |
| `ProductDto?` (Nullable DTO) | `ProductDto?` | `json['key'] != null ? ProductDto.fromJson(json['key']) : null` |
| `List<ProductDto>` | `List<ProductDto>` | `(json['key'] as List<dynamic>?)?.map((e) => ProductDto.fromJson(e)).toList() ?? []` |
| `List<int>`, `List<string>` | `List<int>`, `List<String>` | `(json['key'] as List<dynamic>?)?.map((e) => e as int).toList() ?? []` |
| `Dictionary<string, string>` | `Map<String, String>` | `json['key'] != null ? Map<String, String>.from(json['key']) : {}` |
| `Dictionary<string, object>` | `Map<String, dynamic>` | `json['key'] != null ? Map<String, dynamic>.from(json['key']) : {}` |
| `ResponseDto<T>` (Generic) | `ResponseDto<T>` | Supports `fromJsonT(json['data'])` & `toJsonT(data)` |

---

## License

[MIT License](LICENSE)

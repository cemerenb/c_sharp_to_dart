# C# to Dart Model Generator (Visual Studio Code Extension)

Bu extension, **Visual Studio Code** içerisinde C# DTO ve model sınıflarını otomatik olarak temiz ve eksiksiz Dart model sınıflarına dönüştürerek doğrudan kod editörünüze yapıştırır (**Paste C# as Dart**).

Backend'den (Swagger, C# projesi, web sayfası vb.) kopyaladığınız C# sınıfını VS Code'da tek bir kısayol veya sağ tık ile Dart koduna dönüştürüp yapıştırabilirsiniz.

---

## Özellikler

* **Paste C# as Dart (`Ctrl + Alt + V`)**: Panodaki (clipboard) C# sınıfını otomatik algılar, Dart modeline dönüştürür ve imlecin bulunduğu konuma anında yapıştırır.
* **Convert Selection**: Editörde seçili C# kodunu yerinde Dart koduna dönüştürür.
* **Sağ Tık Menü Entegrasyonu**: Kod editöründe sağ tıklayarak **Paste C# as Dart** menüsüne kolayca erişebilirsiniz.
* **Eksiksiz Dart Kodu Üretimi**:
  - `final` değişkenler
  - Named `required` parametreli constructor
  - Güvenli tip dönüşümlü `factory Model.fromJson(Map<String, dynamic> json)`
  - `Map<String, dynamic> toJson()`
  - Generic sınıflar için `fromJsonT` ve `toJsonT` desteği
  - Nullable türler, listeler, iç içe DTO'lar, sözlükler (`Map`) ve DateTime dönüşümleri
  - Underscore ve kısaltmaları doğru yöneten camelCase isimlendirme

---

## Nasıl Kullanılır?

1. Herhangi bir yerden bir C# sınıfını kopyalayın (`Ctrl + C`).
2. Visual Studio Code'da Dart dosyanızı (`.dart`) açın.
3. Modeli yapıştırmak istediğiniz yere imleci getirin.
4. Aşağıdaki yöntemlerden biriyle yapıştırın:
   - **Klavye Kısayolu**: `Ctrl + Alt + V` (macOS: `Cmd + Alt + V`)
   - **Sağ Tık Menüsü**: Editöre sağ tıklayıp **Paste C# as Dart** seçeneğini seçin.
   - **Command Palette**: `Ctrl + Shift + P` basıp **Paste C# as Dart** yazın.
5. C# modeli otomatik olarak dönüştürülüp imlecin olduğu yere yapıştırılır!

---

## Örnek Dönüşüm

### Panodaki C# Kodu:
```csharp
public class UserDto
{
    public int Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public bool IsActive { get; set; }
}
```

### Yapıştırılan Dart Kodu:
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

## Desteklenen C# → Dart Tipleri

| C# Tipi | Dart Karşılığı | Default / Parse Davranışı |
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
| `ResponseDto<T>` (Generic) | `ResponseDto<T>` | `fromJsonT(json['data'])` & `toJsonT(data)` desteği |

---

## VS Code'a Kurulum (.VSIX)

Proje kök dizininde hazır paketlenmiş dosya bulunmaktadır:
`csharp-to-dart-model-generator-1.0.0.vsix`

### Yöntem 1: VS Code Arayüzünden Kurulum
1. Visual Studio Code'u açın.
2. Sol menüdeki **Extensions** (Eklentiler) sekmesine tıklayın (`Ctrl + Shift + X`).
3. Extensions panelinin sağ üst köşesindeki **`...`** (Views and More Actions) menüsüne tıklayın.
4. **Install from VSIX...** seçeneğini seçin.
5. `csharp-to-dart-model-generator-1.0.0.vsix` dosyasını seçip **Install** butonuna tıklayın.

### Yöntem 2: Terminalden Kurulum
```bash
code --install-extension csharp-to-dart-model-generator-1.0.0.vsix
```

---

## Geliştirme ve Test

### Projeyi Derleme:
```bash
npm run compile
```

### Unit Testleri Çalıştırma:
```bash
npm test
```
*(21 test senaryosu Node.js test runner ile çalıştırılır ve doğrulanır).*

### VSIX Paketi Oluşturma:
```bash
npm run package
```

---

## Yeni Type Mapping Nasıl Eklenir?

1. `src/mapper/typeMapper.ts` dosyasını açın.
2. `simpleTypeMap` nesnesine yeni C# tipini ve Dart karşılığını ekleyin:
   ```typescript
   private static readonly simpleTypeMap: Record<string, string> = {
     // ...
     biginteger: 'int',
     mycustomtype: 'String',
   };
   ```
3. Eğer tip özel serialization mantığı gerektiriyorsa:
   - `src/models/types.ts` içindeki `DartTypeKind` enum'ına yeni türü ekleyin.
   - `src/generator/dartGenerator.ts` içerisindeki `generateFromJsonExpression` ve `generateToJsonExpression` fonksiyonlarına branch ekleyin.
4. `src/test/converter.test.ts` içerisine unit test ekleyin ve `npm test` ile doğrulayın.

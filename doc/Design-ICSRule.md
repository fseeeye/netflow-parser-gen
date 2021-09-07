# 设计文档 - ICS规则过滤

Tysrcipt项目自动生成的目标是Rust项目中`src/ics_rule/rule_arg/`下的文件，内容为

* 各协议的规则定义
* 规则与数据包的比较方法`check_arg()`

主要改动文件：

* 新建`src/filter`
* 改动`src/types`下`struct.ts`和`enum.ts`
* 改动`src/field`下各相关文件





## Part1: 类型过滤

在生成代码之前，由于Protocol中定义的部分Struct/StructEnum由于存在Rust项目尚未支持的类型，所以需要预先对每个Protocol中定义的Struct/StructEnum进行过滤。

不过，若对Protocol中的成员变量structs逐个过滤的话，会出现某些field被过滤了，但是它相关联的Struct/StructEnum依旧存在的情况。究其原因，structs是种array类型，并不能反映各成员间的关系。

故，目前采用的过滤方案为从入口点Header开始，迭代遍历每个Struct/StructEnum的成员变量，筛选出受支持的类型，最后生成所有成员均为受支持类型的cleanHeader。

* Tips：下文中，`dirty`一词指代含有不受支持成员的原始结构；`clean`一词指代过滤后的结构，其成员均为受支持类型。

### 代码实现

对结构体中成员类型的过滤代码均存放在`src/filter/`中，下面依次阐述目录下各文件作用：

* `struct.ts`: 实现`filterStructICS()`函数，完成传入"dirty" Struct，输出"clean" Struct的功能。由于Struct本身并没有什么特别的，只是其成员变量`fields`中可能存在不受支持的Field类型，故函数内仅仅是调用`filterFieldsICS()` 并 构建新Struct返回 而已。

  * 运行输入输出示例：

  ```
  === dirty Struct ===
  Struct {
    name: 'PDU',
    fields: [
      NumericField { name: 'function_code', fieldType: [NumericType] },
      EnumField {
        name: 'data',
        structEnum: [StructEnum],
        fieldName: undefined
      }
    ]
  }
  
  === clean Struct ===
  Struct {
    name: 'PDU',
    fields: [
      EnumField {
        name: 'data',
        structEnum: [StructEnum],
        fieldName: undefined
      }
    ]
  }
  ```

  

* `field.ts`: 实现`filterFieldsICS()`函数，完成传入"dirty Field[]"，输出"clean Field[]"的功能。其中完成如下操作：

  1. 过滤出所有目前支持的Field类型：NumericField、StructField、EnumField。
  2. 在 Field[] 内去除 EnumField 中存储的 StructEnum 的 choiceField 所指向的 Field（有点绕...），简单来说就是 作为ChoiceField的Field 和 EnumField 不能同时存在。（因为Rust项目中，已经将Enum的Variant和Variant下的Attributes绑定，比如：function_code为某值时，接下来的参数需要和其对应，否则在解析规则时就能报错。此时，ChoiceFeild已经是毫无意义的存在。具体实现还是参见Rust项目规则示例和相关代码，短篇幅不太能解释清楚。）
  3. 我们还要去除 choiceField 类型为 InputLengthChoice，因为它并不能很好支持上述Rust设计。
  4. 遍历剩下的Field中StructField和EnumField，为它们分别调用`filterStructICS()`和`filterStructEnumICS()`，迭代过滤成员。

  * 运行输入输出示例：

  ```
  === dirty Field[] ===
  [
    NumericField {
      name: 'read_start_address',
      fieldType: NumericType {
        _name: 'u16',
        _parserFunctionName: 'be_u16',
        bitLength: 16
      }
    },
    BytesReferenceField {
      name: 'write_register_values',
      lengthVariable: CountVariable {
        name: 'write_count',
        expressionGenerator: [Function: expressionGenerator]
      }
    }
  ]
  
  === clean Field[] ===
  [
    NumericField {
      name: 'read_start_address',
      fieldType: NumericType {
        _name: 'u16',
        _parserFunctionName: 'be_u16',
        bitLength: 16
      }
    }
  ]
  ```

  

* `enum.ts`: 

  * 实现`filterVariantsICS()`函数，完成传入"dirty Variants[]"，输出"clean Variants[]"的功能。过滤出受支持的AnonymousStructVariant、EofVariant类型，并对AnonymousStructVariant中存储的Fields迭代调用`filterFieldsICS()` 。
  * 实现`filterStructEnumICS()`函数，具体功能和`filterStructICS()`函数类似。
  * 运行输入输出示例：

  ```
  === dirty Enum ===
  StructEnum {
    name: 'Data',
    variants: [
      AnonymousStructVariant {
        ...
      },
      NamedStructVariant {
        ...
      },
      EofVariant {
        ...
      },
    ],
    choiceField: BasicEnumChoice {
      field: NumericField { name: 'xx', fieldType: [NumericType] }
    }
  }
  
  === clean Enum ===
  StructEnum {
    name: 'Data',
    variants: [
      AnonymousStructVariant {
        ...
      },
      EofVariant {
        ...
      },
    ],
    choiceField: BasicEnumChoice {
      field: NumericField { name: 'xx', fieldType: [NumericType] }
    }
  }
  ```



> Tips: 实现如上代码后，只需要将Header（Struct类型）传入`filterStructICS()`，即可得到过滤后的Header，且其所有成员、子成员均经过过滤。





## Part2: 规则生成

生成Rust代码中对规则的定义，思路为：为clean Header及其成员中的每个Struct/StructEnum分别生成其定义。

### Struct/StructEnum代码实现

* `src/types/struct.ts`：在`Struct`类中新建方法`detectorDefinition()`和`protected generateRuleArgFields()`，用于生成结构体定义。首先生成Rust Struct定义基本框架，然后遍历其`fields`成员，调用成员的`definitionRuleArg?()`方法生成中间内容。

  * 示例生成代码文件内容：

  ```rust
  #[derive(Serialize, Deserialize, Debug)]
  pub struct ModbusRspArg {
      #[serde(flatten)]
      pub mbap_header: Option<MbapHeader>,
      // ...
  }
  ```

  

* `src/types/enum.ts`：在`StructEnum`类中同样新建方法`detectorDefinition()`和`protected generateRuleArgVariants()`，用于生成枚举体定义。首先生成Rust Enum定义基本框架，然后遍历其`variants`成员，调用成员的`definitionRuleArg?()`方法生成中间内容。

  * 示例生成代码文件内容：

  ```rust
  #[derive(Serialize, Deserialize, Debug)]
  #[serde(tag = "function_code", content = "data")]
  pub enum Data {
      #[serde(alias = "1", alias = "0x01")]
      ReadCoils {
          byte_count: Option<u8>,
      },
      // ... 
  }
  ```

  

### Fields/Variants代码实现

首先，在`src/field/base.ts`的`Field`接口 以及 `src/types/enum.ts`的`EnumVariant`接口 中定义`definitionRuleArg?(): string`。接下来在各个受支持的Field和Variant类型中实现上述方法。

* `src/field/numeric.ts`：为NumericField实现上述方法。

  * 示例生成代码文件内容：

  ```rust
  pub length: Option<u16>
  ```

  

* `src/field/struct.ts`：为StructField实现上述方法。（Struct需要添加serdeAttribute-flatten，从而在json中平铺。）

  * 示例生成代码文件内容：

  ```rust
  #[serde(flatten)]
  pub pdu: Option<PDU>,
  ```

  

* `src/field/enum.ts`：为EnumField实现上述方法。（同样需要添加flatten前缀）

  * 示例生成代码文件内容：

  ```rust
  #[serde(flatten)]
  pub data: Option<Data>
  ```

  

* `src/types/enum.ts`：为AnonymousStructVariant、EofVariant类型实现上述方法。（出于设计要求，Variants定义均需要添加alias前缀）

  * 示例生成代码文件内容：

  ```rust
  #[serde(alias = "143", alias = "0x8f")]
  WriteMultipleCoilsExc {
    exception_code: Option<u8>,
    // ...
  },
  ```





## Part3：比较方法生成

生成rust代码中结构体/枚举体方法`check_arg()`，用于规则和数据包的比较。同样，思路为：为clean Header及其成员中的每个Struct/StructEnum分别生成其比较方法`check_arg()`。

### Struct/StructEnum代码实现

* `src/types/struct.ts`：在`Struct`类中新建方法`detectorFunctionDefinition()`。首先生成主体框架，然后遍历其`fields`成员，调用成员的`generateDetectCode()`方法，生成`check_arg`方法的比较代码。

  * 示例生成代码文件内容：

  ```rust
  impl MbapHeader {
      pub fn check_arg(&self, mbap_header: &modbus_rsp::MbapHeader) -> bool {
          if let Some(transaction_id) = self.transaction_id {
              if transaction_id != mbap_header.transaction_id {
                  return false
              }
          }
          // ...
          
          true
      }
  }
  ```

* `src/types/enum.ts`：在`StructEnum`类中同样新建方法`detectorFunctionDefinition()`。首先生成主体框架，然后遍历其`variants`成员，调用成员的`detectorImplementation()`方法，生成`check_arg`方法的比较代码。

  * 示例生成代码文件内容：

  ```rust
  impl Data {
      pub fn check_arg(&self, data: &modbus_rsp::Data) -> bool {
          match self {
              Data::ReadCoils {byte_count} => {
                  if let modbus_rsp::Data::ReadCoils {byte_count: _byte_count, .. } = &data {
                      if let Some(byte_count) = byte_count {
                          if byte_count != _byte_count {
                              return false
                          }
                      }
                  } else {
                      return false
                  }
              },
              // ...
          }
          
          true
      }
  }
  ```

### Fields/Variants代码实现

首先，在`src/field/base.ts`的`Field`接口 以及 `src/types/enum.ts`的`EnumVariant`接口 中分别定义 `generateDetectCode?()` 和 `detectorImplementation?()`。接下来在各个受支持的Field和Variant类型中实现上述方法。

* `src/field/numeric.ts`：为NumericField实现上述方法。（Field各类型均需要根据其是属于Struct还是StructEnum生成不同的代码内容）

  * 示例生成代码文件内容 (父类型为Struct)：

  ```rust
  if let Some(transaction_id) = self.transaction_id {
    if transaction_id != mbap_header.transaction_id {
      return false
    }
  }
  ```

  * 示例生成代码文件内容 (祖父类型为StructEnum)：

  ```rust
  if let Some(transaction_id) = transaction_id {
    if transaction_id != _transaction_id {
      return false
    }
  }
  ```

  

* `src/field/struct.ts`：为StructField实现上述方法。

  * 示例生成代码文件内容 (父类型为Struct)：

  ```rust
  if let Some(pdu) = &self.pdu {
    if !pdu.check_arg(&modbus_rsp_header.pdu) {
      return false
    }
  }
  ```

  * 示例生成代码文件内容 (祖父类型为StructEnum)：

  ```rust
  if let Some(pdu) = pdu {
    if !pdu.check_arg(_pdu) {
      return false
    }
  }
  ```

  

* `src/field/enum.ts`：为EnumField实现上述方法。

  * 示例生成代码文件内容 (父类型为Struct)：：

  ```rust
  if let Some(data) = &self.data {
    if !data.check_arg(&pdu.data) {
      return false
    }
  }
  ```

  * 示例生成代码文件内容：

  ```rust
  if let Some(data) = data {
    if !data.check_arg(_data) {
      return false
    }
  }
  ```

  

* `src/types/enum.ts`：为AnonymousStructVariant、EofVariant类型实现上述方法，生成Match Arm，AnonymousStructVariant还要遍历其fields，继续生成代码内容。

  * 示例生成代码文件内容：

  ```rust
  Data::ReadCoilsExc {exception_code} => {
    if let modbus_rsp::Data::ReadCoilsExc {exception_code: _exception_code, .. } = &data {
      if let Some(exception_code) = exception_code {
        if exception_code != _exception_code {
          return false
        }
      }
      // ...
    } else {
      return false
    }
  },
  ```





## Part4：其它

调整部分文件组织结构：

* 将`src/`下的`utils.ts` / `nom.ts` / `variables.ts`均放入`src/utils/`文件夹下，这类文件应不依赖于任何`src/`下其它文件。
* 将`src/protocols`下的`generator.ts`分离成`protocol.ts` & `protocol-info.ts`

目前依旧存在的设计问题：

* 项目中依旧还存在少量循环引用问题，其根本原因是`src/types`和`src/field`下文件耦合严重造成的，因为存在特殊的Struct和StructEnum类型。

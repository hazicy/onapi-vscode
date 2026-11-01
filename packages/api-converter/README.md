# @onapi/api-converter

仓库内私有 pnpm workspace；由应用构建器编译 TypeScript 源码，不发布 npm。核心格式转换 API 与应用导入导出入口分别暴露，后者依赖共享请求模型。

## API

所有转换函数返回 `{ data, warnings }`，无效文档或无法解析的引用抛出 `Error`。输入不被修改。警告包含 `code`、`path` 和 `message`，由调用应用展示。

| 函数           | 输入 → 输出                                                |
| -------------- | ---------------------------------------------------------- |
| `readPostman`  | Postman Collection 2.0 / 2.1 → `Collection`                |
| `writePostman` | `Collection` → Postman Collection 2.1                      |
| `readThunder`  | Thunder Client 单集合 JSON → `Collection`                  |
| `readOpenApi`  | Swagger 2.0 / OpenAPI 3.0、3.1 常见请求结构 → `Collection` |
| `writeOpenApi` | `Collection` → Swagger 2.0 / OpenAPI 3.0.3                 |

```ts
import { readPostman, writeOpenApi } from "@onapi/api-converter";

const imported = readPostman(postmanDocument);
const exported = writeOpenApi(imported.data, "3.0");
const warnings = [...imported.warnings, ...exported.warnings];
```

[统一模型](./src/model.ts) 定义集合、目录、请求、参数、请求体、认证、响应示例和环境。[格式适配器](./src/index.ts) 不依赖 VS Code、React、Mock 引擎或应用 `src`。

[应用适配层](./src/adapters/converter-adapter.ts) 负责转换器集合模型与当前原生请求记录、项目 ID、HTTP 配置和环境之间的映射。Postman 原生导入导出保留集合和目录变量及脚本；其他格式通过转换器模型进入相同的记录结构。应用入口为 `importMethod.fromPostman/fromThunder/fromOpenApi`、`exportMethod.toPostman/toOpenApi`，保留按需加载。输入格式文档为 `unknown`，导出输入为 `CollectionExportInput`；返回 `ConversionResult<T>`，成功时包含 `data`，失败时包含错误 `message`。导入和文件导出展示转换警告。

## 边界

- Postman/Thunder 脚本、测试和 onapi 任务不互相翻译，返回警告；支持的请求体为 JSON、文本、XML、表单和二进制文件路径。GraphQL 专用结构需手动配置。
- Basic、Bearer、API Key 有显式认证映射。OpenAPI 的 OAuth 等复杂安全方案需手动配置，并返回警告。
- 本地 `$ref` 保留为独立 Schema 的 `$defs`，导出时提升到文档的 `definitions` / `components.schemas`，支持递归引用。外部文件/URL 引用须在调用前合并；不做网络访问，未解决引用明确报错。
- 一条请求只承载一个请求体媒体类型；多媒体类型导入取第一个并警告。OpenAPI 安全要求包含多个方案时只导入第一个并警告。
- Swagger 2.0 只支持一个服务器，不支持 cookie 参数；相应转换返回警告。同路径、同方法的重复请求保留第一个并警告。
- Postman Collection 不携带独立环境文件：导出采用第一个环境的变量默认值，再用集合变量覆盖；多个环境返回警告。Postman 不保留请求/响应 JSON Schema，返回警告。
- 这不是完整的 OpenAPI 校验器或任意版本之间的无损规范转换器；OpenAPI 3.1 的方言专属 Schema 关键字不保证可降级为 3.0 / 2.0。

## 验证

在仓库根目录运行：

```sh
pnpm --dir packages/api-converter typecheck
node --experimental-vm-modules --test "tests/api-converter/*.test.mjs"
```

测试直接覆盖现用格式读取/写入 API 和真实应用导入导出入口，包括格式往返、Postman Schema 校验、认证、变量、嵌套及空目录、表单文件、响应示例、服务器路径、参数覆盖、循环及深层 Schema、非法输入和按需加载。导出及导入结果与输入相互隔离；迁移自旧补全器的行为用例在这些入口验证，不保留仅供旧测试调用的转换实现。

格式参考：[OpenAPI 3.0.3](https://spec.openapis.org/oas/v3.0.3)、[Postman 2.1](https://schema.postman.com/json/collection/v2.1.0/docs/index.html)。

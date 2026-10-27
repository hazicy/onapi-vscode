# 本地文件存储

扩展激活时先恢复 Repository 内存快照，再初始化 UI。请求、集合统一使用 `id`、`parentId`、`kind`，HTTP、GraphQL、SSE 的 `request` 使用原生字段；UI 和持久化使用同一份记录。业务代码从 Repository 读取已提交快照；写入接口返回 Promise，只有文件写入成功才更新快照、通知界面并返回成功。所有读改写操作在队列内读取最新快照，防止并发编辑丢失更新；退出扩展时等待待处理写入。

集合、请求和环境统一保存在扩展的 `globalStorageUri/.api-client/`，打开不同项目或未打开文件夹时使用同一份数据，不在项目目录创建文件。

- `config.json`：格式版本（2）、集合级认证、脚本、变量及其他配置，不内嵌请求，也没有单独的 `itemMetadata`。
- `collections/<集合ID>/collection.json`：集合定义。子集合使用嵌套目录。
- `collections/<集合ID>/<请求ID>.json`：完整的统一请求记录（包含 `id`、`parentId`、`kind`、`request` 等字段）。根级请求直接位于 `collections/`。
- `environments/<环境ID>.json`：HTTP 环境。
- `environments/protocols/<环境ID>.json`：Socket 等协议使用的环境模型。
- 所有协议共享 `collections/`。排序只使用节点的 `sort`，同值时按 ID 确定顺序，不再保存单独的排序索引。
- `projects/<项目配置键>/`：额外 Onapi 项目的隔离存储。

Postman 嵌套集合只在执行 SDK、导入和导出边界构造或解析。删除请求直接移除记录，不使用 `is_deleted`。

文件名使用编码后的稳定 ID，重命名显示名称不会改变文件路径。只读取当前全局目录中的 JSON 格式，不扫描或迁移旧缓存、项目目录、旧版 globalState 中的配置，也不修补旧记录。当前环境放在 `globalState`，现有 UI 偏好继续使用 `globalState`。

认证配置、Token、密码、API Key、Cookie、常见敏感参数以及 `type: "secret"` 的变量值存入 `context.secrets`。JSON 文件仅保留 `$secret` 引用。引用对应本机 SecretStorage，复制数据到其他机器后需重新填写凭据。请通过认证配置或 secret 类型环境变量引用敏感数据；任意脚本、自由文本和响应示例中手写的凭据无法可靠自动识别。

请求历史位于 `globalStorageUri/history/<全局存储与项目摘要>.jsonl`，最多保留 200 条，排除响应正文，并使用相同的凭据隔离。读取时跳过损坏的 JSONL 行。

文件通过 `vscode.workspace.fs` 写入临时文件，再重命名替换；写入失败返回失败结果，保留上一份已提交快照和编辑器草稿。单文件替换安全，多文件修改不是文件系统事务。外部编辑或文件恢复产生的变化通过 FileSystemWatcher 合并处理，完整校验后才替换快照。无效 JSON、重复 ID 或无效请求/环境结构会保留上一次有效快照并报告错误。修复文件后自动恢复刷新。打开的编辑器更新未修改的内容，同时保留尚未保存的编辑。

Repository 是文件 I/O 边界，未来同步实现可在这一边界读取和提交快照；当前没有云同步。旧数据文件不会被自动读取、转换或删除。集合、历史和凭据均位于项目目录以外。

编辑器草稿、发送结果独立保存在 UI 状态中。持久化记录不包含 `is_create`、`is_changed`、`save_loading` 等临时标记；保存确认仅更新对应的已保存基线，较新的输入不会被旧保存结果覆盖。

存储版本不支持或 JSON 损坏时，扩展仍注册三个侧边栏视图，并显示可点击的错误项。此时暂停写入以保护原文件；可重试、打开存储目录修复文件，或选择“备份并重建”。重建会将原 `.api-client/` 完整重命名为同目录下的 `.api-client.backup-<唯一ID>`，再创建空存储，不转换旧格式。文件修复后的监听刷新也能恢复视图，无需重新激活扩展。

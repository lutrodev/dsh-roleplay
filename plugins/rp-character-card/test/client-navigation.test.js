import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { relatedLorebookNames } from '../src/client-state.js'

test('角色卡列表点击后推进到独立详情视图', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  assert.match(client, /selected === null \? h\(CharacterList/)
  assert.match(client, /返回角色卡列表/)
  assert.match(client, /dsh-roleplay\.asset-modal-scroll-lock/)
  assert.match(client, /body\.style\.overflow = 'hidden'/)
  assert.doesNotMatch(client, /className: css\.grid/)
  assert.match(styles, /\.view \{ flex:1; min-height:0; overflow:hidden; \}/)
  assert.match(styles, /\.content > :last-child \{ flex:1; min-width:0; min-height:0; overflow:hidden;/)
  assert.match(styles, /\.content > :first-child \{[^}]*min-height:48px;/)
  assert.match(styles, /100dvh/)
  assert.match(styles, /overscroll-behavior:contain/)
})

test('角色卡入口使用独立的资料卡图标', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  assert.match(client, /h\(IconCharacterCardOutline16, \{ size: wide \? 16 : 18 \}\)/)
  assert.doesNotMatch(client, /IconAgentPresetOutline16/)
})

test('角色卡导入由覆盖按钮区域的原生文件输入直接打开', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  assert.match(client, /className: css\.fileInput, type: 'file'/)
  assert.match(client, /'aria-label': '导入角色卡 PNG 或 JSON'/)
  assert.doesNotMatch(client, /\.current\?\.click\(\)|hidden: true/)
  assert.match(styles, /\.fileInput \{ position:absolute; inset:0; width:100%; height:100%; opacity:0;/)
  assert.match(styles, /\.importButton:focus-within/)
})

test('角色卡导入成功后刷新列表而不进入详情', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  assert.match(client, /await rpc\(connection, 'import'/)
  assert.match(client, /setRefresh\(value => value \+ 1\)/)
  assert.doesNotMatch(client, /setSelected\(value\.imported\.id\)/)
})

test('角色卡删除明确说明相关对话不会阻止删除', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  assert.match(client, /对话正在使用这张角色卡/)
  assert.match(client, /删除不会改写已有消息/)
  assert.match(client, /对话会自动将它视为已移除/)
  assert.match(client, /暂时无法列出全部关联内容，但仍可删除角色卡/)
  assert.match(client, /deletePreview\.status === 'error'/)
  assert.doesNotMatch(client, /SESSION_RUNNING|SESSION_DETACH_FAILED|正在生成回复，请等待完成后再删除/)
  assert.match(client, /onClick: \(\) => void remove\(\), disabled: saving/)
  assert.match(client, /ASSET_CORRUPT/)
  assert.match(client, /暂时无法读取这张角色卡的必要信息，角色卡没有删除/)
  assert.match(client, /删除角色卡/)
  assert.match(client, /characterActionErrorMessage\(actionError\)/)
  assert.match(client, /characterFormatLabel\(detail\.format\)/)
  assert.doesNotMatch(client, /归档会话并删除|归档并删除中|将归档|关联会话会继续保留|actionError\.code.*actionError\.message|revision \$\{detail\.revision\}/)
  assert.doesNotMatch(client, /修订|供 Session 选择|Extensions|隔离提示词|模型上下文/)
})

test('角色卡详情展示完整字段并以可排序草稿编辑备用开场', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  assert.match(client, /character\.alternateGreetings/)
  assert.match(client, /h\(Reorder\.Group/)
  assert.match(client, /crypto\.randomUUID\(\)/)
  assert.match(client, /群聊开场（只读）/)
  assert.match(client, /附加数据/)
  assert.match(client, /label: '关联世界书', value: lorebookNames\.join\('、'\)/)
  assert.match(client, /关联世界书 · \$\{entries\} 条设定/)
  assert.match(client, /'未关联世界书'/)
  assert.doesNotMatch(client, /附带 .*世界设定|\$\{item\.lorebookEntries\} 条世界设定/)
  assert.doesNotMatch(client, /JSON\.stringify\(character\.characterBook/)
  assert.match(client, /h\(DirtyBar/)
  assert.match(client, /className: `\$\{css\.detail\} \$\{css\.detailEditing\}`/)
  assert.match(client, /h\(SectionEditor, \{ label: '角色设定'/)
  assert.doesNotMatch(client, /className: css\.editForm/)
  assert.match(styles, /\.quarantine summary \{[^}]*font:11px\/18px/)
})

test('角色卡详情可将已保存内容和关联世界书导出为 V3 PNG', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  assert.match(client, /rpc\(connection, 'export', \{ id: detail\.id \}\)/)
  assert.match(client, /'aria-label': '导出 Character Card V3 PNG'/)
  assert.match(client, /exporting \? '导出中…' : '导出'/)
  assert.match(client, /包含 \$\{lorebookCount\} 本关联世界书、\$\{value\.lorebookEntries\} 条设定/)
  assert.match(client, /new Blob\(\[bytes\], \{ type: value\.mimeType \}\)/)
  assert.match(client, /anchor\.download = value\.fileName/)
  assert.match(client, /role: 'status'/)
  assert.match(client, /关联世界书暂时不可用，未生成文件/)
  assert.match(client, /暂时无法读取角色卡或关联世界书，未生成文件/)
  assert.match(styles, /\.notice \{[^}]*state-success-primary/)
})

test('角色卡详情只列出关联世界书名称', () => {
  assert.deepEqual(relatedLorebookNames({
    embeddedLorebooks: [
      { id: 'one', name: '  海港设定  ', status: 'managed' },
      { id: 'two', name: '旧设定', status: 'deleted' },
      { id: 'three', name: '', status: 'managed' },
    ],
    character: { characterBook: { name: '导入时名称', entries: [{ content: '不应显示' }] } },
  }), ['海港设定'])
  assert.deepEqual(relatedLorebookNames({ character: { characterBook: { name: '旧版世界书' } } }), ['旧版世界书'])
  assert.deepEqual(relatedLorebookNames({ character: { characterBook: { entries: [] } } }), [])
})

test('角色卡插件向会话编排注册唯一的原生创建与编辑界面', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  assert.match(client, /export const inject = \['slots', 'connection', 'rpAssetEditors'\]/)
  assert.match(client, /ctx\.rpAssetEditors\.register\('character', CharacterSessionEditor\)/)
  assert.match(client, /function CharacterSessionEditor/)
  assert.match(client, /h\(CharacterEditForm/)
})

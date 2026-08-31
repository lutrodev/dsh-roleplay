import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { descriptionLabelInsertion } from '../src/client-state.js'

test('我的人设使用固定侧栏入口，并通过表单支持默认人设、快捷描述和头像', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  assert.match(client, /view === 'list'[\s\S]*\? h\(PersonaList/)
  assert.match(client, /view !== 'edit'/)
  assert.match(client, /h\(PersonaForm/)
  assert.match(client, /editing \? 'update' : 'create'/)
  assert.match(client, /'编辑人设'/)
  assert.match(client, /className: compact \? `\$\{css\.dialog\} \$\{css\.compactDialog\}`/)
  assert.match(client, /'set-default'/)
  assert.match(client, /\{ id: 'delete', label: '删除人设', danger: true \}/)
  assert.match(client, /function DeletePersonaDialog/)
  assert.match(client, /rpc\(connection, 'delete', \{ id: target\.id, expectedRevision: target\.revision \}\)/)
  assert.match(client, /IconEllipsisOutline16/)
  assert.match(client, /IconTrashOutline16/)
  assert.match(client, /className: css\.moreAction/)
  assert.match(client, /'aria-label': '我的人设'/)
  assert.match(client, /h\('span', \{ className: css\.triggerLabel \}, '我的人设'\)/)
  assert.doesNotMatch(client, /defaultPersona|refreshDefault|onLibraryChange/)
  assert.doesNotMatch(client, /侧边栏(?:正在)?展示这个人设/)
  assert.match(client, /返回我的人设列表/)
  assert.match(client, /dsh-roleplay\.asset-modal-scroll-lock/)
  assert.match(client, /body\.style\.overflow = 'hidden'/)
  assert.doesNotMatch(client, /IconSearchOutline16|搜索我的人设|导入 JSON/)
  assert.match(client, /type: 'file'/)
  assert.match(client, /tabIndex: -1, 'aria-hidden': true/)
  assert.match(client, /image\/png,image\/jpeg,image\/webp/)
  assert.match(client, /'性别', '外貌', '年龄', '身份', '说话方式', '背景故事', '爱好'/)
  assert.match(client, /selectionStart/)
  assert.match(client, /MotionConfig/)
  assert.match(client, /reducedMotion: 'user'/)
  assert.match(styles, /\.view \{ flex:1; min-height:0; overflow:hidden; \}/)
  assert.match(styles, /\.content > :last-child \{ flex:1; min-width:0; min-height:0; overflow:hidden;/)
  assert.match(styles, /\.content > :first-child \{[^}]*min-height:48px;/)
  assert.match(styles, /100dvh/)
  assert.match(styles, /\.createRow \{/)
  assert.match(styles, /\.listToolbar \{/)
  assert.match(styles, /width:min\(680px,100%\)/)
  assert.match(styles, /\.row \{[^}]*min-height:60px;/)
  assert.match(styles, /\.rowWrap \{ display:grid; grid-template-columns:minmax\(0,1fr\) 36px;/)
  assert.match(styles, /\.rowWrap\[data-default="true"\] \{ border-color:/)
  assert.match(styles, /\.moreAction \{ display:inline-flex;/)
  assert.match(styles, /\.deleteDialog \{ width:min\(460px,/)
  assert.match(styles, /\.deleteSummary \{ display:flex; flex-direction:column;/)
  assert.match(styles, /\.compactDialog \{ width:min\(760px,calc\(100vw - 48px\)\); height:min\(520px,/)
  assert.doesNotMatch(styles, /\.triggerAvatar/)
  assert.match(styles, /overscroll-behavior:contain/)
  assert.match(styles, /\.avatarPicker \{/)
  assert.match(styles, /\.quickInputs \{/)
})

test('人设操作错误和状态使用用户语言', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  assert.match(client, /personaErrorMessage\(error\)/)
  assert.match(client, /暂时无法加载人设，请稍后重试/)
  assert.doesNotMatch(client, /\$\{error\.code\}|修订/)
  assert.match(client, /expectedRevision: detail\.revision/)
})

test('人设头像按可见性加载并按修订复用', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  assert.match(client, /useInView\(avatarRef, \{ margin: '200px 0px', once: true \}\)/)
  assert.match(client, /cachedAvatar\(connection, persona\.id, persona\.revision\)/)
  assert.match(client, /const key = `\$\{id\}:\$\{revision \?\? ''\}`/)
})

test('人设插件向会话编排注册同一个创建与编辑表单', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  assert.match(client, /export const inject = \['slots', 'rpRemote', 'rpAssetEditors'\]/)
  assert.match(client, /ctx\.rpAssetEditors\.register\('persona', PersonaSessionEditor\)/)
  assert.match(client, /function PersonaSessionEditor/)
  assert.match(client, /h\(PersonaForm/)
})

test('描述快捷项另起一行，但光标停在字段名后的冒号处', () => {
  assert.deepEqual(descriptionLabelInsertion('', '外貌', 0), {
    value: '外貌：',
    caret: '外貌：'.length,
  })

  const description = '外貌：银发'
  assert.deepEqual(descriptionLabelInsertion(description, '年龄', description.length), {
    value: '外貌：银发\n年龄：',
    caret: '外貌：银发\n年龄：'.length,
  })
})

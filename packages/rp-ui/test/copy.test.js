import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('共享操作反馈使用明确的用户语言', async () => {
  const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8')
  assert.match(source, /没有保存成功/)
  assert.match(source, /撤销修改/)
  assert.match(source, /关闭编辑面板/)
  assert.doesNotMatch(source, /保存失败|放弃修改|关闭检查器/)
})

test('角色卡使用独立的资料卡图标语义', async () => {
  const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8')
  assert.match(source, /function IconCharacterCardOutline16/)
  assert.match(source, /h\('rect'.*width: 13\.5.*height: 12\.5/)
  assert.match(source, /h\('circle'.*cx: 5\.1.*cy: 5\.7/)
})

test('共享加载指示使用 Motion 并尊重减少动态效果偏好', async () => {
  const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8')
  assert.match(source, /function LoadingSpinner/)
  assert.match(source, /const reduced = useReducedMotion\(\)/)
  assert.match(source, /animate: reduced \? undefined : \{ rotate: 360 \}/)
  assert.match(source, /\.rpui-loadingSpinner\{[^}]*border-top-color:transparent/)
})

test('工作台页签保持图标与文字分栏并压缩纵向占用', async () => {
  const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8')
  assert.match(source, /function WorkbenchTabs\([^)]*\) \{\n  ensureWorkbenchStyles\(\)/)
  assert.match(source, /new ResizeObserver\(revealSelected\)/)
  assert.match(source, /list\.scrollTo\(\{ left:/)
  assert.match(source, /event\.key === 'ArrowRight'[\s\S]*event\.key === 'ArrowLeft'[\s\S]*event\.key === 'Home'[\s\S]*event\.key === 'End'/)
  assert.match(source, /tabIndex: value === item\.id \? 0 : -1/)
  assert.match(source, /span:not\(\.rpui-tab-indicator\):not\(\.rpui-tab-icon\)/)
  assert.match(source, /\.rpui-tab>span\.rpui-tab-icon:not\(\.rpui-tab-indicator\)\{display:grid;grid-area:icon;place-items:center\}/)
  assert.match(source, /\.rpui-tab\{[^}]*min-width:104px;padding:6px 10px/)
  assert.match(source, /\.rpui-tabs\{[^}]*scroll-snap-type:x proximity;scrollbar-width:none/)
  assert.match(source, /\.rpui-content\{display:flex;min-height:0;flex:1;flex-direction:column\}/)
})

test('工作台弹窗锁定页面与对话滚动容器并支持重入恢复', async () => {
  const source = await readFile(new URL('../src/index.js', import.meta.url), 'utf8')
  assert.match(source, /document\.documentElement/)
  assert.match(source, /document\.querySelectorAll\('\[data-conversation-scroll\]'\)/)
  assert.match(source, /const scrollLocks = new Map\(\)/)
  assert.match(source, /active\.count \+= 1/)
  assert.match(source, /element\.style\.overflow = 'hidden'/)
  assert.match(source, /element\.style\.overflow = current\.overflow/)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { commonStateConditionIssue, parseCommonStateCondition, serializeCommonStateCondition } from '../src/client-condition.js'

test('常用变量条件在可读表单和安全表达式之间往返', () => {
  const source = 'state("story", "/progress") >= 50'
  const parsed = parseCommonStateCondition(source)
  assert.deepEqual(parsed, { namespace: 'story', path: '/progress', operator: '>=', valueText: '50', valueType: 'number' })
  assert.equal(serializeCommonStateCondition(parsed), source)
})

test('常用变量条件自动区分数字、布尔值和文字', () => {
  assert.equal(serializeCommonStateCondition({ namespace: 'story', path: '/chapter', operator: '==', valueText: '3' }), 'state("story", "/chapter") == 3')
  assert.equal(serializeCommonStateCondition({ namespace: 'story', path: '/finished', operator: '==', valueText: 'true' }), 'state("story", "/finished") == true')
  assert.equal(serializeCommonStateCondition({ namespace: 'story', path: '/finished', operator: '==', valueText: '是' }), 'state("story", "/finished") == true')
  assert.equal(serializeCommonStateCondition({ namespace: 'story', path: '/route', operator: '==', valueText: 'main' }), 'state("story", "/route") == "main"')
  assert.equal(serializeCommonStateCondition({ namespace: 'story', path: '', operator: '>=', valueText: '50' }), undefined)
  assert.equal(serializeCommonStateCondition({ namespace: 'story', path: '/progress', operator: '>=', valueText: '' }), undefined)
  assert.equal(serializeCommonStateCondition({ namespace: 'story', path: '', operator: '>=', valueText: '' }), undefined)
})

test('常用表单保留变量分组与完整路径，组合条件留给高级编辑器', () => {
  const combat = 'state("combat", "/encounter/danger") > 2'
  assert.equal(serializeCommonStateCondition(parseCommonStateCondition(combat)), combat)
  assert.equal(parseCommonStateCondition('state("story", "/progress") >= 50 && state("story", "/chapter") > 2'), null)
  assert.equal(parseCommonStateCondition('exists("story", "/ending")'), null)
})

test('常用表单要求有效分组、以斜杠开头的完整路径和值', () => {
  assert.equal(commonStateConditionIssue({ namespace: 'story', path: 'plot/progress', valueText: '50' }), '完整路径必须以 / 开头，例如 /plot/progress。')
  assert.equal(commonStateConditionIssue({ namespace: 'Story', path: '/plot/progress', valueText: '50' }), '变量分组需使用小写字母或数字开头，可包含点、横线、下划线或冒号。')
  assert.equal(commonStateConditionIssue({ namespace: '', path: '', valueText: '' }), '变量分组需使用小写字母或数字开头，可包含点、横线、下划线或冒号。')
  assert.equal(commonStateConditionIssue({ namespace: 'story', path: '/plot/progress', valueText: '50' }), null)
  assert.equal(parseCommonStateCondition('state("story", "/code") == ""'), null)
})

test('修改常用条件的其他字段时保留原有文字类型', () => {
  const parsed = parseCommonStateCondition('state("story", "/code") == "50"')
  assert.equal(serializeCommonStateCondition({ ...parsed, operator: '!=' }), 'state("story", "/code") != "50"')
  assert.equal(parseCommonStateCondition('state("story", "/finished") == false').valueText, '否')
})

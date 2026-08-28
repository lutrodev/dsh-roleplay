import React, { useId, useState } from 'react'
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m } from 'motion/react'
import { isRoleplaySessionSummary } from 'dsh-roleplay-rp-ui/session-summary'
import {
  IconChevronDownOutline14,
  IconDataOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import {
  STATE_ACTIVITY_PROJECTION_KEY,
  STATE_DISPLAY_ANCHOR_KIND,
  STATE_DISPLAY_RETRACTION_KIND,
  countStateActivity,
  countStateLeaves,
  escapeStatePointer,
  isComplexStateValue,
  latestStateDisplayAnchorKey,
  orderedStateEntries,
  presentStatePrimitive,
  stateDisplayAnchorNodeDefinition,
  stateDisplayRetractionNodeDefinition,
  stateFieldLabel,
  stateFieldSchema,
  stateNamespaceTitle,
  stateActivityTransition,
} from './client-state.js'
import { css, ensureStyles } from './client-styles.generated.js'

export const inject = ['slots', 'uiConversation']
const h = React.createElement
const motionTransition = { duration: 0.16, ease: [0.2, 0, 0, 1] }

export function apply(ctx) {
  ctx.effect(ensureStyles)
  ctx.uiConversation.events.register(stateDisplayAnchorNodeDefinition)
  ctx.uiConversation.events.register(stateDisplayRetractionNodeDefinition)
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: STATE_DISPLAY_ANCHOR_KIND,
  }, StateDisplayAnchor))
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: STATE_DISPLAY_RETRACTION_KIND,
  }, StateDisplayRetraction))
}

/** Render the live card only at the latest successful assistant reply. */
export function StateDisplayAnchor({ node, sessionId, useChat, useSessions, useProjection }) {
  const activeKey = useChat(latestStateDisplayAnchorKey)
  const roleplay = useSessions(state => {
    const summary = state.byId?.[sessionId]
    return isRoleplaySessionSummary(summary) && summary.origin !== 'subagent'
  })
  if (!roleplay || activeKey !== node.key) return h(HiddenMarker)
  return h(StateVariableCard, { useProjection })
}

function StateDisplayRetraction() {
  return h(HiddenMarker)
}

function HiddenMarker() {
  return h('span', { className: css.hiddenMarker, hidden: true, 'aria-hidden': true })
}

/** Projection-only, read-only presentation of every current variable. */
export function StateVariableCard({ useProjection }) {
  const state = useProjection('rp/state')
  const activity = useProjection(STATE_ACTIVITY_PROJECTION_KEY)
  const namespaces = Object.entries(state?.namespaces ?? {})
  const [expanded, setExpanded] = useState(false)
  const bodyId = useId()
  if (namespaces.length === 0) return h(HiddenMarker)
  const variableCount = namespaces.reduce((total, [, snapshot]) => total + countStateLeaves(snapshot.value), 0)
  const activityCount = countStateActivity(activity)

  return h(MotionConfig, { reducedMotion: 'user' },
    h(LazyMotion, { features: domAnimation },
      h('article', {
        className: css.card,
        'data-rp-state-display-card': 'true',
        'aria-label': '当前会话变量',
      },
      h('button', {
        type: 'button',
        className: css.cardHeader,
        'aria-expanded': expanded,
        'aria-controls': bodyId,
        'aria-label': expanded ? '折叠会话变量' : '展开会话变量',
        onClick: () => setExpanded(value => !value),
      },
      h('span', { className: css.headerIcon, 'aria-hidden': true }, h(IconDataOutline16, { size: 16 })),
      h('span', { className: css.headerTitle },
        h('strong', null, '会话变量'),
        h('small', null, `${namespaces.length} 组 · ${variableCount} 项`)),
      h('span', { className: css.headerMeta, 'aria-hidden': true },
        activityCount > 0 ? h('span', { className: css.changedSummary }, `本轮更新 ${activityCount}`) : null),
      h('span', {
        className: css.chevron,
        'data-expanded': expanded ? 'true' : 'false',
        'aria-hidden': true,
      }, h(IconChevronDownOutline14, { size: 14 }))),
      h(AnimatePresence, { initial: false }, expanded
        ? h(m.div, {
          key: 'state-body',
          id: bodyId,
          className: css.bodyMotion,
          initial: { height: 0, opacity: 0 },
          animate: { height: 'auto', opacity: 1 },
          exit: { height: 0, opacity: 0 },
          transition: motionTransition,
        }, h('div', { className: css.cardBody }, ...namespaces.map(([id, snapshot]) => h(NamespaceView, {
          key: id,
          id,
          snapshot,
          activity,
        }))))
        : null)))
  )
}

function NamespaceView({ id, snapshot, activity }) {
  const title = stateNamespaceTitle(id, snapshot)
  const value = snapshot?.value
  const schema = snapshot?.definition?.schema
  const description = typeof snapshot?.definition?.description === 'string'
    ? snapshot.definition.description.trim()
    : ''
  return h('section', {
    className: css.namespace,
    'aria-label': title,
    'aria-description': description || undefined,
  },
    h('header', { className: css.namespaceHeader },
      h('span', { className: css.namespaceTitle, title: description || undefined },
        h('strong', null, title))),
    isComplexStateValue(value)
      ? h('div', { className: css.variableTree, role: 'list' }, ...renderChildren({
        value, schema, namespace: id, activity, path: '', trail: [],
      }))
      : h('div', { className: css.variableTree, role: 'list' }, h(VariableValue, {
        label: schema?.title ?? '当前值',
        value,
        schema,
        namespace: id,
        activity,
        path: '',
      })))
}

function renderChildren({ value, schema, namespace, activity, path, trail = [] }) {
  const array = Array.isArray(value)
  const entries = orderedStateEntries(value, schema)
  if (entries.length === 0) {
    const empty = h('div', { key: `${path}:empty`, className: css.emptyGroup, role: 'listitem' }, '暂无内容')
    return trail.length === 0
      ? [empty]
      : [h(VariableGroup, {
        key: `${path}:empty-group`,
        segments: trail,
        description: trail.at(-1)?.description,
      }, empty)]
  }
  const rendered = []
  let valueRun = []
  let valueRunKey

  const flushValueRun = () => {
    if (valueRun.length === 0) return
    if (trail.length === 0) {
      rendered.push(...valueRun)
    } else {
      rendered.push(h(VariableGroup, {
        key: `${valueRunKey}:values`,
        segments: trail,
        description: trail.at(-1)?.description,
      }, ...valueRun))
    }
    valueRun = []
    valueRunKey = undefined
  }

  entries.forEach(([key, child]) => {
    const childSchema = stateFieldSchema(schema, key, array)
    const childPath = `${path}/${escapeStatePointer(key)}`
    const label = stateFieldLabel(key, childSchema, array)
    if (isComplexStateValue(child)) {
      flushValueRun()
      const description = typeof childSchema?.description === 'string'
        ? childSchema.description.trim()
        : ''
      rendered.push(...renderChildren({
        value: child,
        schema: childSchema,
        namespace,
        activity,
        path: childPath,
        trail: [...trail, { label, description }],
      }))
      return
    }
    valueRunKey ??= childPath
    valueRun.push(h(VariableValue, {
        key: childPath,
        label,
        value: child,
        schema: childSchema,
        namespace,
        activity,
        path: childPath,
      }))
  })
  flushValueRun()
  return rendered
}

function VariableGroup({ segments, description, children }) {
  const pathLabel = segments.map(segment => segment.label).join(' › ')
  return h('section', {
    className: css.variableGroup,
    role: 'listitem',
    'aria-label': pathLabel,
    'aria-description': description || undefined,
  },
  h('header', { className: css.groupHeader },
    h(BreadcrumbTrail, { segments })),
  h('div', { className: css.groupChildren, role: 'list' }, ...React.Children.toArray(children)))
}

function BreadcrumbTrail({ segments }) {
  const pathLabel = segments.map(segment => segment.label).join(' › ')
  const children = []
  segments.forEach((segment, index) => {
    if (index > 0) {
      children.push(h('span', {
        key: `separator:${index}`,
        className: css.breadcrumbSeparator,
        'aria-hidden': true,
      }, '›'))
    }
    children.push(h('span', {
      key: `segment:${index}:${segment.label}`,
      className: index === segments.length - 1 ? css.breadcrumbCurrent : css.breadcrumbSegment,
      title: segment.description || undefined,
    }, segment.label))
  })
  return h('span', {
    className: css.breadcrumb,
    title: pathLabel,
    'data-rp-state-display-breadcrumb': pathLabel,
  }, ...children)
}

function VariableValue({ label, value, schema, namespace, activity, path }) {
  const transition = stateActivityTransition(activity, namespace, path)
  const changed = transition !== undefined
  const description = typeof schema?.description === 'string' ? schema.description.trim() : ''
  return h('div', {
    className: css.variableRow,
    role: 'listitem',
    'data-updated': changed ? 'true' : undefined,
  },
  h('div', {
    className: css.variableName,
    title: description || undefined,
    'aria-description': description || undefined,
  },
    h('span', { className: css.variableNameLine },
      changed ? h('span', { className: css.updatedDot, 'aria-hidden': true }) : null,
      h('strong', null, label),
      changed ? h('span', { className: css.srOnly }, '本轮更新') : null)),
  h(PrimitiveValue, { value, transition }))
}

function PrimitiveValue({ value, transition }) {
  const presented = presentStatePrimitive(value)
  const previous = transition === undefined
    ? undefined
    : presentStatePrimitive(transition.before.exists ? transition.before.value : undefined)
  const long = presented.long || previous?.long === true
  const [expanded, setExpanded] = useState(false)
  return h('div', { className: css.valueColumn },
    transition === undefined
      ? h(PrimitiveText, { presented, expanded })
      : h('span', {
        className: css.transitionValue,
        'data-rp-state-display-transition': 'true',
      },
      h(PrimitiveText, { presented: previous, expanded, className: css.transitionBefore, label: '之前值：' }),
      h('span', { className: css.transitionArrow, 'aria-hidden': true }, '→'),
      h(PrimitiveText, { presented, expanded, className: css.transitionCurrent, label: '当前值：' })),
    long ? h('button', {
      type: 'button',
      className: css.valueToggle,
      'aria-expanded': expanded,
      'aria-label': expanded ? '收起内容' : '展开完整内容',
      onClick: () => setExpanded(value => !value),
    }, expanded ? '收起' : '展开') : null)
}

function PrimitiveText({ presented, expanded, className = '', label }) {
  return h('span', {
    className: `${css.variableValue} ${className} ${presented.long && !expanded ? css.valueClamped : ''}`,
    'data-kind': presented.kind,
    'data-empty': presented.empty ? 'true' : undefined,
    title: presented.long && !expanded ? presented.text : undefined,
  },
  label === undefined ? null : h('span', { className: css.srOnly }, label),
  presented.text)
}

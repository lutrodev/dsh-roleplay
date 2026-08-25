import { validateStateValue } from 'dsh-roleplay-rp-state/schema'
import {
  collectMvuLoreInitialValues,
  inspectMvuOpening,
  inspectMvuSource,
  materializeMvuInitialValue,
  selectMvuOpening,
} from './convert.js'
import { materializeNativeMvuState } from './native-state.js'
import { applyMvuOpeningOperations } from './opening-operations.js'

/**
 * Convert community MVU setup into one complete native State v2 bootstrap.
 * This runs only while the conversation has no user message; later turns read
 * the Session-owned snapshot and never recalculate it from shared assets.
 */
export function materializeMvuProfile({
  profile,
  previousProfile,
  character,
  source,
  books,
  blank = true,
}) {
  if (!blank) return undefined
  const sourceInspection = inspectMvuSource(source, character)
  const loreInspection = collectMvuLoreInitialValues(books)
  const opening = selectedOpening(profile, sourceInspection)
  const initializerDetected = sourceInspection.initializerDetected
    || loreInspection.detected
    || opening?.initializerDetected === true
  const selectionChanged = previousProfile === undefined || setupSelection(profile) !== setupSelection(previousProfile)
  const openingChanged = selectionChanged && opening?.detected === true
  const shouldReplaceBootstrap = selectionChanged && (initializerDetected || previousProfile !== undefined)
  if (!shouldReplaceBootstrap && !openingChanged) return undefined
  const diagnostics = [
    ...sourceInspection.diagnostics,
    ...loreInspection.diagnostics,
    ...(opening?.diagnostics ?? []),
  ]
  const initialValue = materializeMvuInitialValue(
    sourceInspection,
    opening,
    loreInspection.initialValue,
    { applyOpeningUpdates: false },
  )
  return {
    ...(shouldReplaceBootstrap
      ? {
          stateBootstrap: initializerDetected
            ? materializeOpeningState({
                initialValue,
                opening,
                source,
                character,
                books,
                diagnostics,
                declaredInitializer: sourceInspection.initializerDetected
                  || loreInspection.detected
                  || opening?.valueInitializerDetected === true,
              })
            : { version: 2, namespaces: [] },
        }
      : {}),
    ...(openingChanged ? { openingMessageText: opening.text.length === 0 ? null : opening.text } : {}),
  }
}

function materializeOpeningState({
  initialValue,
  opening,
  source,
  character,
  books,
  diagnostics,
  declaredInitializer,
}) {
  let bootstrap = materializeNativeMvuState({ initialValue, source, character, books, diagnostics })
  if (!Array.isArray(opening?.updates) || opening.updates.length === 0) return bootstrap
  const story = bootstrap.namespaces[0]
  const operationInput = declaredInitializer ? story.initialValue : initialValue
  const applied = applyMvuOpeningOperations(operationInput, opening.updates, {
    ...(declaredInitializer
      ? {
          schema: story.definition.schema,
          descriptionCells: false,
          validate(candidate) {
            validateStateValue(story.definition.schema, candidate, 'opening variables')
          },
        }
      : {}),
  })
  if (!applied.ok) {
    story.diagnostics.setup.push({
      code: 'MVU_OPERATION_LOGIC_IGNORED',
      severity: 'info',
      path: '/session/scene/opening',
      message: `已忽略无法安全应用的开场变量更新；该开场中的变量命令均未生效。${applied.message}`,
    })
    return bootstrap
  }
  if (declaredInitializer) {
    story.initialValue = applied.value
    return bootstrap
  }
  bootstrap = materializeNativeMvuState({
    initialValue: applied.value,
    source,
    character,
    books,
    diagnostics,
  })
  return bootstrap
}

function setupSelection(profile) {
  return JSON.stringify({
    cardId: profile?.resources?.card?.id ?? null,
    lorebookIds: (profile?.resources?.lorebooks ?? []).map(binding => binding.id),
    openingSource: profile?.scene?.openingSource ?? null,
    openingIndex: profile?.scene?.openingIndex ?? 0,
    openingText: profile?.scene?.openingText ?? null,
  })
}

function selectedOpening(profile, sourceInspection) {
  const source = profile?.scene?.openingSource
  if (source === 'skip') return undefined
  if (source === 'custom') {
    return profile?.scene?.openingText === undefined
      ? undefined
      : inspectMvuOpening(profile.scene.openingText, '/session/scene/openingText')
  }
  if (source !== 'card') return undefined
  return selectMvuOpening(sourceInspection, profile.scene.openingIndex ?? 0, profile.scene.openingText)
    ?? (profile.scene.openingText === undefined ? undefined : inspectMvuOpening(profile.scene.openingText, '/session/scene/openingText'))
}

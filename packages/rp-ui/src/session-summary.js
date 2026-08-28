/**
 * Read the Roleplay identity from the public DSH SessionSummary contract.
 * Projection-backed summary fields live under projectionValues in DSH 0.1.2.
 */
export function isRoleplaySessionSummary(summary) {
  return summary?.projectionValues?.agentPreset === 'roleplay'
}

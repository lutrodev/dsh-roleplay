/** JSON-safe values accepted by the shared Roleplay Remote boundary. */
export type RoleplayJsonValue =
  | null
  | boolean
  | number
  | string
  | readonly RoleplayJsonValue[]
  | { readonly [key: string]: RoleplayJsonValue }

/** Browser-to-host payload shared by all Roleplay domain routes. */
export type RoleplayRemotePayload = Readonly<Record<string, RoleplayJsonValue>>

export interface RoleplayDomainError {
  readonly code: string
  readonly message: string
}

/** Stable domain envelope returned by existing Roleplay APIs. */
export type RoleplayDomainResult =
  | { readonly ok: true; readonly value?: RoleplayJsonValue }
  | { readonly ok: false; readonly error: RoleplayDomainError }

/** Host result carried by Typert's own transport envelope. */
export interface RoleplayTransportResponse {
  readonly ok: true
  readonly value?: RoleplayDomainResult
}

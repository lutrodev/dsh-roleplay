import type { Context } from '@deepseek-ai/cordis'

export interface TypertRemoteServiceOptions {
  readonly namespace?: string
}

export declare class TypertRemoteService {
  constructor(ctx: Context, serviceKey: string, options?: TypertRemoteServiceOptions)
}

export type RemoteMethodDecorator = <This extends object, Args extends unknown[], Result>(
  method: (this: This, ...args: Args) => Result,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Result>,
) => void

export declare function Remote<This extends object, Args extends unknown[], Result>(
  method: (this: This, ...args: Args) => Result,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Result>,
): void
export declare function Remote(name: string): RemoteMethodDecorator

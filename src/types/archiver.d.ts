// archiver 8 is ESM-only and exports archive classes instead of a default factory.
// Only the members used by the plugin download route are declared.
declare module 'archiver' {
  import { Stream } from 'node:stream';
  export class ZipArchive extends Stream {
    constructor(options?: { zlib?: { level?: number } } & Record<string, unknown>);
    pipe<T extends NodeJS.WritableStream>(dest: T): T;
    file(path: string, opts: { name: string }): this;
    finalize(): Promise<void>;
  }
}

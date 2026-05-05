import { Buffer } from 'buffer';

(window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;

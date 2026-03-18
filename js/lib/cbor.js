function concatBytes(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function encodeLength(majorType, value) {
  const n = typeof value === "bigint" ? value : BigInt(value);
  if (n < 24n) {
    return Uint8Array.of((majorType << 5) | Number(n));
  }
  if (n <= 0xffn) {
    return Uint8Array.of((majorType << 5) | 24, Number(n));
  }
  if (n <= 0xffffn) {
    return Uint8Array.of((majorType << 5) | 25, Number((n >> 8n) & 0xffn), Number(n & 0xffn));
  }
  if (n <= 0xffffffffn) {
    return Uint8Array.of(
      (majorType << 5) | 26,
      Number((n >> 24n) & 0xffn),
      Number((n >> 16n) & 0xffn),
      Number((n >> 8n) & 0xffn),
      Number(n & 0xffn),
    );
  }
  return Uint8Array.of(
    (majorType << 5) | 27,
    Number((n >> 56n) & 0xffn),
    Number((n >> 48n) & 0xffn),
    Number((n >> 40n) & 0xffn),
    Number((n >> 32n) & 0xffn),
    Number((n >> 24n) & 0xffn),
    Number((n >> 16n) & 0xffn),
    Number((n >> 8n) & 0xffn),
    Number(n & 0xffn),
  );
}

function encodeUnsigned(value) {
  return encodeLength(0, value);
}

function encodeNegative(value) {
  const n = typeof value === "bigint" ? value : BigInt(value);
  return encodeLength(1, -1n - n);
}

function encodeBytes(value) {
  const prefix = encodeLength(2, value.length);
  return concatBytes([prefix, value]);
}

function encodeText(value) {
  const bytes = new TextEncoder().encode(value);
  const prefix = encodeLength(3, bytes.length);
  return concatBytes([prefix, bytes]);
}

function encodeArray(value) {
  const chunks = [encodeLength(4, value.length)];
  for (const item of value) {
    chunks.push(encodeCbor(item));
  }
  return concatBytes(chunks);
}

function encodeMap(value) {
  const entries = value instanceof Map ? [...value.entries()] : Object.entries(value);
  const chunks = [encodeLength(5, entries.length)];
  for (const [key, item] of entries) {
    chunks.push(encodeCbor(key));
    chunks.push(encodeCbor(item));
  }
  return concatBytes(chunks);
}

export function encodeCbor(value) {
  if (value instanceof Uint8Array) {
    return encodeBytes(value);
  }
  if (Array.isArray(value)) {
    return encodeArray(value);
  }
  if (value instanceof Map || (value && typeof value === "object")) {
    return encodeMap(value);
  }
  if (typeof value === "string") {
    return encodeText(value);
  }
  if (typeof value === "number" || typeof value === "bigint") {
    const n = typeof value === "bigint" ? value : BigInt(value);
    return n >= 0n ? encodeUnsigned(n) : encodeNegative(n);
  }
  if (typeof value === "boolean") {
    return Uint8Array.of(value ? 0xf5 : 0xf4);
  }
  if (value === null) {
    return Uint8Array.of(0xf6);
  }
  throw new Error("Unsupported CBOR value type.");
}

function readUInt(bytes, offset, additional) {
  if (additional < 24) {
    return { value: BigInt(additional), offset };
  }
  if (additional === 24) {
    return { value: BigInt(bytes[offset]), offset: offset + 1 };
  }
  if (additional === 25) {
    return {
      value: BigInt((bytes[offset] << 8) | bytes[offset + 1]),
      offset: offset + 2,
    };
  }
  if (additional === 26) {
    return {
      value: BigInt(
        (bytes[offset] * 0x1000000) +
          ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]),
      ),
      offset: offset + 4,
    };
  }
  if (additional === 27) {
    let value = 0n;
    for (let i = 0; i < 8; i += 1) {
      value = (value << 8n) | BigInt(bytes[offset + i]);
    }
    return { value, offset: offset + 8 };
  }
  throw new Error("Indefinite lengths are not supported.");
}

function maybeNarrowBigInt(value) {
  return value <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(value) : value;
}

function decodeItem(bytes, startOffset) {
  const initialByte = bytes[startOffset];
  const majorType = initialByte >> 5;
  const additional = initialByte & 0x1f;
  let offset = startOffset + 1;

  if (majorType === 0) {
    const out = readUInt(bytes, offset, additional);
    return { value: maybeNarrowBigInt(out.value), offset: out.offset };
  }

  if (majorType === 1) {
    const out = readUInt(bytes, offset, additional);
    const signed = -1n - out.value;
    return { value: maybeNarrowBigInt(signed), offset: out.offset };
  }

  if (majorType === 2 || majorType === 3) {
    const out = readUInt(bytes, offset, additional);
    const length = Number(out.value);
    const end = out.offset + length;
    const slice = bytes.slice(out.offset, end);
    if (majorType === 2) {
      return { value: slice, offset: end };
    }
    return { value: new TextDecoder().decode(slice), offset: end };
  }

  if (majorType === 4) {
    const out = readUInt(bytes, offset, additional);
    offset = out.offset;
    const items = [];
    for (let i = 0; i < Number(out.value); i += 1) {
      const decoded = decodeItem(bytes, offset);
      items.push(decoded.value);
      offset = decoded.offset;
    }
    return { value: items, offset };
  }

  if (majorType === 5) {
    const out = readUInt(bytes, offset, additional);
    offset = out.offset;
    const map = new Map();
    for (let i = 0; i < Number(out.value); i += 1) {
      const keyDecoded = decodeItem(bytes, offset);
      const valueDecoded = decodeItem(bytes, keyDecoded.offset);
      map.set(keyDecoded.value, valueDecoded.value);
      offset = valueDecoded.offset;
    }
    return { value: map, offset };
  }

  if (majorType === 7 && additional === 20) {
    return { value: false, offset };
  }
  if (majorType === 7 && additional === 21) {
    return { value: true, offset };
  }
  if (majorType === 7 && additional === 22) {
    return { value: null, offset };
  }

  throw new Error("Unsupported CBOR major type.");
}

export function decodeCbor(bytes) {
  const input = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  const decoded = decodeItem(input, 0);
  if (decoded.offset !== input.length) {
    throw new Error("Extra bytes detected after CBOR decode.");
  }
  return decoded.value;
}

export function hexToBytes(hex) {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (!normalized || normalized.length % 2 !== 0) {
    throw new Error("Invalid hex input.");
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

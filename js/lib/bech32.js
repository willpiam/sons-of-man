const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values) {
  let chk = 1;
  for (const value of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ value;
    for (let i = 0; i < 5; i += 1) {
      if ((top >> i) & 1) {
        chk ^= GENERATOR[i];
      }
    }
  }
  return chk;
}

function hrpExpand(hrp) {
  const result = [];
  for (let i = 0; i < hrp.length; i += 1) {
    result.push(hrp.charCodeAt(i) >> 5);
  }
  result.push(0);
  for (let i = 0; i < hrp.length; i += 1) {
    result.push(hrp.charCodeAt(i) & 31);
  }
  return result;
}

function createChecksum(hrp, data) {
  const values = [...hrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0];
  const mod = polymod(values) ^ 1;
  const ret = [];
  for (let i = 0; i < 6; i += 1) {
    ret.push((mod >> (5 * (5 - i))) & 31);
  }
  return ret;
}

export function convertBits(data, fromBits, toBits, pad = true) {
  let acc = 0;
  let bits = 0;
  const result = [];
  const maxv = (1 << toBits) - 1;

  for (const value of data) {
    if (value < 0 || (value >> fromBits) !== 0) {
      return null;
    }
    acc = (acc << fromBits) | value;
    bits += fromBits;
    while (bits >= toBits) {
      bits -= toBits;
      result.push((acc >> bits) & maxv);
    }
  }

  if (pad) {
    if (bits > 0) {
      result.push((acc << (toBits - bits)) & maxv);
    }
  } else if (bits >= fromBits || ((acc << (toBits - bits)) & maxv)) {
    return null;
  }

  return result;
}

export function encodeBech32(hrp, data) {
  const checksum = createChecksum(hrp, data);
  const combined = [...data, ...checksum];
  let output = `${hrp}1`;
  for (const value of combined) {
    output += CHARSET[value];
  }
  return output;
}

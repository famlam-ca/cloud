import type { KeyObject } from "node:crypto"
import {
  createHash,
  createPublicKey,
  generateKeyPair,
  randomBytes,
} from "node:crypto"

import type { SSHKeyTypeEnum } from "@/schemas/ssh-key"

function bufferToLengthEncoded(buf: Buffer): Buffer {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(buf.length)
  return Buffer.concat([len, buf])
}

function stringToLengthEncoded(str: string): Buffer {
  return bufferToLengthEncoded(Buffer.from(str, "utf8"))
}

export function buildEd25519PublicKeyBlob(publicKeyRaw: Buffer): Buffer {
  return Buffer.concat([
    stringToLengthEncoded("ssh-ed25519"),
    bufferToLengthEncoded(publicKeyRaw),
  ])
}

function bufferToMpint(buf: Buffer): Buffer {
  let b = buf
  while (b.length > 1 && b[0] === 0x00) b = b.subarray(1)
  if (b.length === 0) b = Buffer.from([0])
  if ((b[0] ?? 0) & 0x80) {
    b = Buffer.concat([Buffer.from([0x00]), b])
  }
  return bufferToLengthEncoded(b)
}

function padPrivateSection(section: Buffer): Buffer {
  const blockSize = 8
  const padLength = (blockSize - (section.length % blockSize)) % blockSize
  const padding = Buffer.from(
    Array.from({ length: padLength }, (_, idx) => idx + 1),
  )
  return Buffer.concat([section, padding])
}

function wrapOpenSSHPrivateKey(
  publicKeyBlob: Buffer,
  privateSection: Buffer,
): string {
  const MAGIC = Buffer.from("openssh-key-v1\0", "utf8")
  const body = Buffer.concat([
    MAGIC,
    stringToLengthEncoded("none"),
    stringToLengthEncoded("none"),
    stringToLengthEncoded(""),
    Buffer.from([0, 0, 0, 1]),
    bufferToLengthEncoded(publicKeyBlob),
    bufferToLengthEncoded(padPrivateSection(privateSection)),
  ])
  const base64Body = body.toString("base64")
  const wrapped = base64Body.match(/.{1,70}/g)?.join("\n") ?? base64Body
  return `-----BEGIN OPENSSH PRIVATE KEY-----\n${wrapped}\n-----END OPENSSH PRIVATE KEY-----\n`
}

export function buildRSAPublicKeyBlob(n: Buffer, e: Buffer): Buffer {
  return Buffer.concat([
    stringToLengthEncoded("ssh-rsa"),
    bufferToMpint(e),
    bufferToMpint(n),
  ])
}

export function formatSSHPublicKey(
  sshType: string,
  blob: Buffer,
  comment: string,
): string {
  return `${sshType} ${blob.toString("base64")} ${comment}`
}

export function fingerprintSSHPublicKey(blob: Buffer): string {
  const sha256 = createHash("sha256").update(blob).digest("base64")
  return `SHA256:${sha256.replace(/=+$/, "")}`
}

export function buildOpenSSHEd25519PrivateKey(
  publicKeyRaw: Buffer,
  privateKeySeed: Buffer,
  comment: string,
): string {
  const sshPublicKeyBlob = buildEd25519PublicKeyBlob(publicKeyRaw)
  const ed25519PrivateKeyField = Buffer.concat([privateKeySeed, publicKeyRaw])
  const checkint = randomBytes(4)

  const privateSection = Buffer.concat([
    checkint,
    checkint,
    stringToLengthEncoded("ssh-ed25519"),
    bufferToLengthEncoded(publicKeyRaw),
    bufferToLengthEncoded(ed25519PrivateKeyField),
    stringToLengthEncoded(comment),
  ])

  return wrapOpenSSHPrivateKey(sshPublicKeyBlob, privateSection)
}

export function buildOpenSSHRSAPrivateKey(
  n: Buffer,
  e: Buffer,
  d: Buffer,
  p: Buffer,
  q: Buffer,
  iqmp: Buffer,
  comment: string,
): string {
  const sshPublicKeyBlob = buildRSAPublicKeyBlob(n, e)
  const checkint = randomBytes(4)

  const privateSection = Buffer.concat([
    checkint,
    checkint,
    stringToLengthEncoded("ssh-rsa"),
    bufferToMpint(n),
    bufferToMpint(e),
    bufferToMpint(d),
    bufferToMpint(iqmp),
    bufferToMpint(p),
    bufferToMpint(q),
    stringToLengthEncoded(comment),
  ])

  return wrapOpenSSHPrivateKey(sshPublicKeyBlob, privateSection)
}

export function generateEd25519KeyPair(): Promise<{
  privateKey: KeyObject
  publicKey: KeyObject
}> {
  return new Promise((resolve, reject) => {
    generateKeyPair("ed25519", {}, (err, publicKey, privateKey) => {
      if (err) reject(err)
      else resolve({ privateKey, publicKey })
    })
  })
}

export function generateRsaKeyPair(
  modulusLength: number,
): Promise<{ privateKey: KeyObject; publicKey: KeyObject }> {
  return new Promise((resolve, reject) => {
    generateKeyPair("rsa", { modulusLength }, (err, publicKey, privateKey) => {
      if (err) reject(err)
      else resolve({ privateKey, publicKey })
    })
  })
}

class SSHWireReader {
  private offset = 0
  constructor(private readonly buf: Buffer) {}

  private readUInt32(): number {
    const val = this.buf.readUInt32BE(this.offset)
    this.offset += 4
    return val
  }

  readLengthPrefixed(): Buffer {
    const len = this.readUInt32()
    if (len < 0 || this.offset + len > this.buf.length) {
      throw new Error("Truncated or invalid key data")
    }
    const field = this.buf.subarray(this.offset, this.offset + len)
    this.offset += len
    return field
  }

  readString(): string {
    return this.readLengthPrefixed().toString("utf8")
  }

  get remaining(): number {
    return this.buf.length - this.offset
  }
}

function stripLeadingZero(buffer: Buffer): Buffer {
  return buffer.length > 1 && buffer[0] === 0x00 ? buffer.subarray(1) : buffer
}

function derToPem(der: Buffer, label: string): string {
  const base64 = der.toString("base64")
  const wrapped = base64.match(/.{1,64}/g)?.join("\n") ?? base64
  return `-----BEGIN ${label}-----\n${wrapped}\n-----END ${label}-----\n`
}

export interface ParsedSSHPublicKey {
  blob: Buffer
  comment: string
  fingerprint: string
  publicKeyString: string
  type: SSHKeyTypeEnum
}

export function parseSSHPublicKey(input: string): ParsedSSHPublicKey {
  const trimmed = input.trim()
  const parts = trimmed.split(/\s+/)
  if (parts.length < 2) {
    throw new Error(
      "Invalid SSH public key: expected '<type> <base64> [comment]'",
    )
  }

  const [declaredType, base64, ...commentParts] = parts
  const comment = commentParts.join(" ")

  let blob: Buffer
  try {
    blob = Buffer.from(base64, "base64")
  } catch {
    throw new Error("Invalid SSH public key: malformed base64")
  }

  if (blob.toString("base64") !== base64 || blob.length === 0) {
    throw new Error("Invalid SSH public key: malformed base64")
  }

  const reader = new SSHWireReader(blob)
  const wireType = reader.readString()

  if (wireType !== declaredType) {
    throw new Error(
      `Invalid SSH public key: declared type "${declaredType}" does not match key data "${wireType}"`,
    )
  }

  let type: SSHKeyTypeEnum

  if (wireType === "ssh-ed25519") {
    const rawKey = reader.readLengthPrefixed()
    if (rawKey.length !== 32) {
      throw new Error("Invalid ed25519 public key: expected 32 bytes")
    }
    if (reader.remaining !== 0) {
      throw new Error("Invalid ed25519 public key: trailing data")
    }

    const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex")
    const pem = derToPem(
      Buffer.concat([ED25519_SPKI_PREFIX, rawKey]),
      "PUBLIC KEY",
    )

    try {
      createPublicKey({ format: "pem", key: pem })
    } catch {
      throw new Error("Invalid ed25519 public key: rejected by crypto engine")
    }

    type = "ed25519"
  } else if (wireType === "ssh-rsa") {
    const e = stripLeadingZero(reader.readLengthPrefixed())
    const n = stripLeadingZero(reader.readLengthPrefixed())
    if (reader.remaining !== 0) {
      throw new Error("Invalid RSA public key: trailing data")
    }
    if (n.length < 256) {
      throw new Error("RSA public key too small: minimum 2048 bits required")
    }

    try {
      createPublicKey({
        format: "jwk",
        key: {
          e: e.toString("base64url"),
          kty: "RSA",
          n: n.toString("base64url"),
        },
      })
    } catch {
      throw new Error("Invalid RSA public key: rejected by crypto engine")
    }

    type = "rsa"
  } else {
    throw new Error(`Unsupported SSH key type: "${wireType}"`)
  }

  return {
    blob,
    comment,
    fingerprint: fingerprintSSHPublicKey(blob),
    publicKeyString: comment
      ? `${wireType} ${base64} ${comment}`
      : `${wireType} ${base64}`,
    type,
  }
}

export function formatSSHKeyName(name: string): string {
  return name.toLowerCase().replace(/\s/g, "_")
}

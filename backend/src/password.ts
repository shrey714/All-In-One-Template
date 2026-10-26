import { randomBytes, scrypt, timingSafeEqual } from "node:crypto"

const COST = 32_768
const BLOCK_SIZE = 8
const PARALLELIZATION = 1
const KEY_LENGTH = 64
const MAX_MEMORY = 64 * 1024 * 1024

function derive(password: string, salt: Buffer, cost = COST) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      KEY_LENGTH,
      { N: cost, r: BLOCK_SIZE, p: PARALLELIZATION, maxmem: MAX_MEMORY },
      (error, key) => (error ? reject(error) : resolve(key))
    )
  })
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await derive(password, salt)
  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLELIZATION}$${salt.toString("hex")}$${key.toString("hex")}`
}

export async function verifyPassword(password: string, encoded: string) {
  const [, costText, blockSizeText, parallelText, saltHex, keyHex] =
    encoded.split("$")
  const cost = Number(costText)
  const blockSize = Number(blockSizeText)
  const parallelization = Number(parallelText)
  if (
    !cost ||
    !blockSize ||
    !parallelization ||
    !saltHex ||
    !keyHex ||
    !Number.isSafeInteger(cost) ||
    !Number.isSafeInteger(blockSize) ||
    !Number.isSafeInteger(parallelization)
  ) {
    return false
  }
  const salt = Buffer.from(saltHex, "hex")
  const expected = Buffer.from(keyHex, "hex")
  if (expected.length !== KEY_LENGTH || salt.length !== 16) return false
  const actual = await derive(password, salt, cost)
  return timingSafeEqual(actual, expected)
}

export const isValidPasswordLength = (value: string) =>
  value.length >= 12 && value.length <= 128

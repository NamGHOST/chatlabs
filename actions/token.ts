"use server"

import { SignJWT } from "jose"

export async function generateToken(payload: any): Promise<string> {
  const secretKey = process.env.JWT_SECRET_KEY
  if (!secretKey) {
    throw new Error("JWT_SECRET environment variable is not set")
  }
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(new TextEncoder().encode(secretKey))

  return jwt
}

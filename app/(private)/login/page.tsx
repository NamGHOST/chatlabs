"use client"

import { useSearchParams } from "next/navigation"
import LoginForm from "@/components/login/login-form"

export default function Login() {
  const searchParams = useSearchParams()

  return (
    <div className="flex min-h-dvh w-full items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <LoginForm />

        {searchParams?.get("message") && (
          <p className="bg-accent text-foreground mt-4 rounded-lg bg-purple-300 p-4 text-center">
            {searchParams?.get("message")}
          </p>
        )}

        {searchParams?.get("error_message") && (
          <p className="text-foreground mt-4 rounded-lg bg-red-300 p-4 text-center">
            {searchParams?.get("error_message")}
          </p>
        )}
      </div>
    </div>
  )
}

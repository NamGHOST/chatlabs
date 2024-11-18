"use client"

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import LoginForm from "@/components/login/login-form"
import React, { ReactPortal, useState } from "react"
import { isMobileScreen } from "@/lib/mobile"

export default function LoginDialog({ redirectTo }: { redirectTo?: string }) {
  const [dialogOpen, setOpen] = useState(false)

  // If the screen is mobile, we'll use redirect instead of a popup
  const openLoginInAPopup = !isMobileScreen()

  return (
    <Dialog open={dialogOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div id={"dialog"} className="fixed inset-0 z-[100] min-h-dvh w-full" />
      </DialogTrigger>
      <DialogContent className="rounded-xl">
        <LoginForm redirectTo={redirectTo} popup={openLoginInAPopup} />
      </DialogContent>
    </Dialog>
  )
}

"use client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react"
import { ChatbotUIContext } from "@/context/context"
import confetti from "canvas-confetti"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { upsertUserQuestion } from "@/db/user_questions"
import Image from "next/image"
import { useTranslation } from "react-i18next"

export default function SubscriptionSuccessPage() {
  const { profile } = useContext(ChatbotUIContext)
  const [response, setResponse] = useState("")

  useEffect(() => {
    if (profile && profile.plan != "free") {
      const event = `purchase_${profile.plan}`
      window.gtag?.("event", event)
      window.dataLayer?.push({ event })
    }

    confetti({
      particleCount: 100,
      startVelocity: 30,
      spread: 360,
      origin: {
        x: Math.random(),
        y: Math.random() - 0.2
      }
    })
  }, [profile])

  function sendResponse() {
    if (!profile?.user_id) return

    upsertUserQuestion({
      user_id: profile?.user_id,
      purchase_reason: response
    })

    router.push("/")
  }

  const { t } = useTranslation()

  const router = useRouter()
  return (
    <div className="size-screen flex size-full flex-col items-center justify-center">
      <div className="mb-6 max-w-2xl text-center text-2xl">
        {t("Thank you for subscribing to our product.")}
      </div>
      <div className="mb-6 max-w-2xl text-center">
        {t(
          "We are dedicated to making this the best possible experience you can have with an LLM. We have one question before you get started."
        )}
      </div>
      <div className={"min-w-[300px] py-4 text-center"}>
        <Label className="mt-8 text-lg font-bold">
          {t("What outcome do you hope this product will help you achieve?")}
        </Label>
        <Textarea
          value={response}
          onChange={e => setResponse(e.target.value)}
          required={true}
          placeholder={t("Write your response here....")}
          className="mt-4"
        ></Textarea>
        <div className="text-muted-foreground mt-2 text-sm">
          {t(
            "We read every response and will make sure we do our best to deliver a better experience."
          )}
        </div>
      </div>
      <Button className="mt-8" onClick={sendResponse}>
        {t("Submit and start chatting")}
      </Button>
    </div>
  )
}

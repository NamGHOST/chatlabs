import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { WithTooltip } from "@/components/ui/with-tooltip"
import { IconX, IconSparkles } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { PlanFeature } from "@/components/upgrade/plan-picker"
import { useContext, useState } from "react"
import { ChatbotUIContext } from "@/context/context"
import { supabase } from "@/lib/supabase/browser-client"
import { createCheckoutSession } from "@/actions/stripe"
import { router } from "next/client"

const BYOK_PLAN_PREFIX = "byok"
const PRO_PLAN_PREFIX = "pro"
const BILLING_CYCLE_YEARLY = "yearly"
const BILLING_CYCLE_MONTHLY = "monthly"

type BILLING_CYCLE = typeof BILLING_CYCLE_YEARLY | typeof BILLING_CYCLE_MONTHLY

interface PlansProps {
  onClose: () => void // Function to close the dialog
  showCloseIcon: boolean
}
export default function Plans({ onClose, showCloseIcon }: PlansProps) {
  const { profile } = useContext(ChatbotUIContext)

  const [billingCycle, setBillingCycle] =
    useState<BILLING_CYCLE>(BILLING_CYCLE_YEARLY)

  const [loading, setLoading] = useState("")
  const [isDialogVisible, setIsDialogVisible] = useState(true)

  const formAction = async (data: FormData): Promise<void> => {
    const user = (await supabase.auth.getUser()).data.user

    if (!user) {
      return window.location.assign("/login")
    }

    data.set("email", user?.email as string)
    data.set("userId", user?.id)

    const { url } = await createCheckoutSession(data)

    window.location.assign(url as string)
  }

  function createFormAction(plan_prefix: string) {
    return (data: FormData) => {
      const plan = `${plan_prefix}_${billingCycle}`
      data.set("plan", plan)
      return formAction(data)
    }
  }

  const handleClick = (plan: string) => {
    const event = `click_${plan}_${billingCycle}`
    window.gtag?.("event", event)
    window.dataLayer?.push({ event })
    setLoading(plan)
  }

  // Function to close the dialog
  const closeDialog = () => {
    setIsDialogVisible(false)
    onClose()
  }

  return (
    <>
      <div
        className={`dialog-container ${isDialogVisible ? "visible" : "hidden"} relative`}
      >
        <div className="absolute right-0 top-0 p-2">
          {showCloseIcon && (
            <button onClick={closeDialog} className="p-2">
              <IconX size={24} />
            </button>
          )}
        </div>
        <div className="my-2">
          <form method={"POST"}>
            <input type={"hidden"} value={billingCycle} name={"billingCycle"} />
            <div className="my-2">
              <ToggleGroup
                type={"single"}
                value={billingCycle}
                onValueChange={value =>
                  setBillingCycle(value as "yearly" | "monthly")
                }
              >
                <ToggleGroupItem value={BILLING_CYCLE_YEARLY}>
                  Yearly
                </ToggleGroupItem>
                <ToggleGroupItem value={BILLING_CYCLE_MONTHLY}>
                  Monthly
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex flex-col md:flex-row">
              <div
                className="border-token-border-light relative flex flex-1 flex-col gap-5 border-t px-6 py-4 text-sm last:border-r-0 md:max-w-xs md:border-r md:border-t-0"
                data-testid="Premium-pricing-modal-column"
              >
                <div className="bg-token-main-surface-primary relative flex flex-col">
                  <div className="flex flex-col gap-1">
                    <WithTooltip
                      side={"top"}
                      display={"Standard"}
                      trigger={
                        <p className="flex items-center gap-2 text-xl font-medium">
                          <IconSparkles className={"text-violet-700"} />
                          Standard
                        </p>
                      }
                    />
                    <div className="flex items-baseline gap-[6px]">
                      <div className="min-h-[56px] flex-col items-baseline gap-[6px]">
                        <p
                          className="text-token-text-tertiary text-base font-light"
                          data-testid="Pro-pricing-column-cost"
                        >
                          {billingCycle === "yearly"
                            ? "$136/month"
                            : "$160/month"}
                        </p>
                        <p
                          className={
                            "text-token-text-tertiary text-xs font-light"
                          }
                        >
                          {billingCycle === "yearly" &&
                            "billed yearly $1632/year"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-token-main-surface-primary relative flex flex-col">
                  <Button
                    disabled={loading !== "" && loading !== BYOK_PLAN_PREFIX}
                    loading={loading === BYOK_PLAN_PREFIX}
                    formAction={createFormAction(BYOK_PLAN_PREFIX)}
                    onClick={() => handleClick(BYOK_PLAN_PREFIX)}
                    className={"bg-violet-700 text-white"}
                  >
                    Upgrade now
                  </Button>
                </div>
                <div className="flex grow flex-col gap-2">
                  <PlanFeature
                    title={" 旗艦模型: GPT-4o、Gemini-Pro-1.5、Claude-3等"}
                  />
                  <PlanFeature title={"獨立Groq api 接口，無限制使用"} />
                  <PlanFeature title={"大量語言模型（100+）"} />
                  <PlanFeature title={"雙視窗同步對話"} />
                  <PlanFeature title={"與圖像對話"} />
                  <PlanFeature title={"與文件對話"} />
                  <PlanFeature title={"自定義助手"} />
                  <PlanFeature title={"自定義插件"} />
                  <PlanFeature
                    title={"圖像生成（Dall-E, Stable Diffusion 3)"}
                  />
                  <PlanFeature title={"持續更新的助手教學內容"} />
                  <PlanFeature
                    check={false}
                    title={
                      <>
                        <PlanFeature title={"加入我們的社群"} />
                        <PlanFeature title={"持續更新的資訊內容"} />
                        <PlanFeature
                          title={"訪問我們的Prompt Wiki（持續更新）"}
                        />
                        <PlanFeature title={"800+ AI工具（持續更新）"} />
                      </>
                    }
                  />
                </div>
              </div>
              <div
                className="border-token-border-light relative flex flex-1 flex-col gap-5 border-t px-6 py-4 text-sm last:border-r-0 md:max-w-xs md:border-r md:border-t-0"
                data-testid="Pro-pricing-modal-column"
              >
                <div className="bg-token-main-surface-primary relative flex flex-col">
                  <div className="flex flex-col gap-1">
                    <p className="flex items-center gap-2 text-xl font-medium">
                      <IconSparkles className={"text-violet-700"} />
                      Pro
                    </p>
                    <div className="min-h-[56px] flex-col items-baseline gap-[6px]">
                      <p
                        className="text-token-text-tertiary text-base font-light"
                        data-testid="Pro-pricing-column-cost"
                      >
                        {billingCycle === "yearly"
                          ? "$204/month"
                          : "$240/month"}
                      </p>
                      <p
                        className={
                          "text-token-text-tertiary text-xs font-light"
                        }
                      >
                        {billingCycle === "yearly" &&
                          "billed yearly $2448/year"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-token-main-surface-primary relative flex flex-col">
                  <Button
                    disabled={loading !== "" && loading !== PRO_PLAN_PREFIX}
                    loading={loading === PRO_PLAN_PREFIX}
                    formAction={createFormAction(PRO_PLAN_PREFIX)}
                    onClick={() => handleClick(PRO_PLAN_PREFIX)}
                    data-testid="select-plan-button-Pros-create"
                    className={"bg-violet-700 text-white"}
                  >
                    Upgrade now
                  </Button>
                </div>
                <div className="flex grow flex-col gap-2">
                  <PlanFeature title="包括標準計劃中的所有內容" />
                  <PlanFeature title="全獨立api 接口（OpenAI, Gemini, perplexity, Claude)" />
                  <PlanFeature title={"高級內容:"} />
                  <PlanFeature
                    check={false}
                    title={
                      <>
                        <PlanFeature title={"進階的人工智能使用技巧"} />
                        <PlanFeature
                          title={"AI+自動化、AI+金融等專門領域內容"}
                        />
                      </>
                    }
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

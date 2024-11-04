import "@/styles/globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export default function ImageGenerationLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`${inter.className} bg-background container mx-auto flex min-h-screen max-w-[2000px] flex-col px-4 md:px-8`}
    >
      {children}
    </div>
  )
}

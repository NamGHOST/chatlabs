import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const Sidebar = () => {
  const router = useRouter()

  return (
    <div className="sidebar">
      {/* ... existing sidebar buttons ... */}

      {/* Text to Image Button */}
      <Link href="/image-generation" className="block w-full">
        <button className="btn-sidebar w-full">Text to Image</button>
      </Link>
    </div>
  )
}

export default Sidebar

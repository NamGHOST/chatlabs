import { FC } from "react"

interface ChatbotUISVGProps {
  theme: "dark" | "light"
  scale?: number
}

export const ChatbotUISVG: FC<ChatbotUISVGProps> = ({ theme, scale = 1 }) => {
  return (
    <svg
    height="100%"
    strokeMiterlimit={10}
    style={{
      fillRule: "nonzero",
      clipRule: "evenodd",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    }}
    viewBox="0 0 200 200"
    width="100%"
    xmlSpace="preserve"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:vectornator="http://vectornator.io"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    {...props}
  >
    <defs />
    <g id="\u5716\u5C641" vectornator:layerName="\u5716\u5C641">
      <path
        d="M118.173 107.168C116.678 106.271 115.758 104.66 115.746 102.917L115.283 38.4834C115.255 34.6067 119.46 32.1756 122.806 34.1341L157.991 54.7306C159.52 55.6256 160.461 57.2631 160.464 59.0347L160.584 123.768C160.591 127.656 156.35 130.063 153.015 128.063L118.173 107.168Z"
        fill="#ffffff"
        fillRule="nonzero"
        opacity={1}
        stroke="#adadad"
        strokeLinecap="butt"
        strokeLinejoin="round"
        strokeWidth={4.87139}
        vectornator:layerName="\u77E9\u5F62 1"
      />
      <path
        d="M103.288 141.361C101.793 140.464 100.873 138.853 100.861 137.11L100.398 72.6765C100.37 68.7997 104.575 66.3687 107.921 68.3272L143.106 88.9237C144.635 89.8187 145.576 91.4562 145.579 93.2278L145.699 157.961C145.707 161.849 141.466 164.256 138.131 162.256L103.288 141.361Z"
        fill="#ffffff"
        fillRule="nonzero"
        opacity={1}
        stroke="#adadad"
        strokeLinecap="butt"
        strokeLinejoin="round"
        strokeWidth={4.87139}
        vectornator:layerName="\u77E9\u5F62 2"
      />
      <path
        d="M87.6532 118.429C86.1582 117.533 85.2384 115.922 85.2258 114.179L84.7628 49.745C84.735 45.8683 88.9399 43.4372 92.2857 45.3957L127.471 65.9922C129 66.8872 129.941 68.5247 129.944 70.2963L130.064 135.029C130.071 138.918 125.831 141.325 122.496 139.325L87.6532 118.429Z"
        fill="#ffffff"
        fillRule="nonzero"
        opacity={1}
        stroke="#adadad"
        strokeLinecap="butt"
        strokeLinejoin="round"
        strokeWidth={4.87139}
        vectornator:layerName="\u77E9\u5F62 3"
      />
      <path
        d="M72.8728 158.71C71.3778 157.813 70.458 156.202 70.4454 154.459L69.9825 90.0253C69.9546 86.1486 74.1596 83.7175 77.5053 85.676L112.691 106.273C114.219 107.167 115.16 108.805 115.164 110.577L115.284 175.31C115.291 179.198 111.05 181.605 107.715 179.605L72.8728 158.71Z"
        fill="#ffffff"
        fillRule="nonzero"
        opacity={1}
        stroke="#adadad"
        strokeLinecap="butt"
        strokeLinejoin="round"
        strokeWidth={4.87139}
        vectornator:layerName="\u77E9\u5F62 4"
      />
      <path
        d="M57.9881 111.064C56.4931 110.167 55.5733 108.556 55.5608 106.813L55.0978 42.3794C55.0699 38.5027 59.2749 36.0716 62.6206 38.0301L97.8058 58.6266C99.3348 59.5216 100.276 61.1591 100.279 62.9307L100.399 127.664C100.406 131.552 96.1655 133.959 92.8306 131.959L57.9881 111.064Z"
        fill="#df9af4"
        fillRule="nonzero"
        opacity={1}
        stroke="#adadad"
        strokeLinecap="butt"
        strokeLinejoin="round"
        strokeWidth={4.87139}
        vectornator:layerName="\u77E9\u5F62 5"
      />
      <path
        d="M42.353 145.257C40.858 144.36 39.9382 142.749 39.9256 141.006L39.4626 76.5725C39.4348 72.6957 43.6397 70.2647 46.9855 72.2232L82.1707 92.8197C83.6996 93.7147 84.6405 95.3521 84.6438 97.1238L84.7641 161.857C84.7713 165.745 80.5304 168.152 77.1955 166.152L42.353 145.257Z"
        fill="#ffffff"
        fillRule="nonzero"
        opacity={1}
        stroke="#adadad"
        strokeLinecap="butt"
        strokeLinejoin="round"
        strokeWidth={4.87139}
        vectornator:layerName="\u77E9\u5F62 6"
      />
    </g>
  </svg>
  )
}

import { FC } from "react"
import * as React from "react"
import { SVGProps } from "react"
interface ChatbotUISVGProps {
  theme: "dark" | "light"
  scale?: number
}

export const ChatbotUISVG: FC<ChatbotUISVGProps> = ({ theme, scale = 1 }) => {
  return (

  <svg
    strokeMiterlimit={10}
    style={{
      fillRule: "nonzero",
      clipRule: "evenodd",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    }}
    viewBox="0 0 200 200"
    xmlSpace="preserve"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:vectornator="http://vectornator.io"
    {...props}
  >
    <g
      vectornator:layerName="\u5716\u5C641"
      stroke="#adadad"
      strokeLinecap="butt"
      strokeWidth={4.871}
    >
      <path
        d="M118.173 107.168a4.998 4.998 0 0 1-2.427-4.251l-.463-64.434c-.028-3.876 4.177-6.307 7.523-4.349l35.185 20.597a4.997 4.997 0 0 1 2.473 4.304l.12 64.733c.007 3.888-4.234 6.295-7.569 4.295l-34.842-20.895Z"
        fill="#fff"
        vectornator:layerName="\u77E9\u5F62 1"
      />
      <path
        d="M103.288 141.361a4.998 4.998 0 0 1-2.427-4.251l-.463-64.434c-.028-3.876 4.177-6.307 7.523-4.349l35.185 20.597a4.997 4.997 0 0 1 2.473 4.304l.12 64.733c.008 3.888-4.233 6.295-7.568 4.295l-34.843-20.895Z"
        fill="#fff"
        vectornator:layerName="\u77E9\u5F62 2"
      />
      <path
        d="M87.653 118.429a4.997 4.997 0 0 1-2.427-4.25l-.463-64.434c-.028-3.877 4.177-6.308 7.523-4.35l35.185 20.597a4.997 4.997 0 0 1 2.473 4.304l.12 64.733c.007 3.889-4.233 6.296-7.568 4.296l-34.843-20.896Z"
        fill="#fff"
        vectornator:layerName="\u77E9\u5F62 3"
      />
      <path
        d="M72.873 158.71a5 5 0 0 1-2.428-4.251l-.462-64.434c-.028-3.876 4.177-6.308 7.522-4.349l35.186 20.597a5 5 0 0 1 2.473 4.304l.12 64.733c.007 3.888-4.234 6.295-7.569 4.295L72.873 158.71Z"
        fill="#fff"
        vectornator:layerName="\u77E9\u5F62 4"
      />
      <path
        d="M57.988 111.064a5 5 0 0 1-2.427-4.251l-.463-64.434c-.028-3.876 4.177-6.307 7.523-4.349l35.185 20.597a4.997 4.997 0 0 1 2.473 4.304l.12 64.733c.007 3.888-4.234 6.295-7.568 4.295l-34.843-20.895Z"
        fill="#df9af4"
        vectornator:layerName="\u77E9\u5F62 5"
      />
      <path
        d="M42.353 145.257a5 5 0 0 1-2.427-4.251l-.463-64.433c-.028-3.877 4.177-6.308 7.523-4.35L82.17 92.82a4.998 4.998 0 0 1 2.473 4.304l.12 64.733c.007 3.888-4.234 6.295-7.569 4.295l-34.842-20.895Z"
        fill="#fff"
        vectornator:layerName="\u77E9\u5F62 6"
      />
    </g>
  </svg>
  )
}

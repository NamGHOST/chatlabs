import { webScraperTool } from "./library/webScraperTool"
import { imageGeneratorTool } from "@/lib/platformTools/library/imageGenerator"
import { stableDiffusionTools } from "@/lib/platformTools/library/stableDiffusionGenerator"
import { flux1ProTools } from "@/lib/platformTools/library/lfuxImageGenerator"
import { exaResearcherTool } from "./library/exaSearch"
import { webSearchTool } from "./library/TavilySearch"
import { yahooFinanceTool } from "./library/yahooFinanceTool"

// Add your tool to the list
export const platformToolList = [
  //exaResearcherTool,
  webScraperTool,
  yahooFinanceTool
  ///webSearchTool,
  ///imageGeneratorTool,
  ///stableDiffusionTools,
  ///flux1ProTools
]

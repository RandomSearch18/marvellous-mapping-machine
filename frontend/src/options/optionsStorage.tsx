import { store, useEffect } from "voby"

export type Options = {
  /** Frontend-only options */
  app: {
    weightOverlay: boolean
  }
}

const defaultOptions: Options = {
  app: {
    weightOverlay: true,
  },
}

function getInitialOptions(): Options {
  const stored = localStorage.getItem("options")
  if (!stored) return defaultOptions
  try {
    return JSON.parse(stored)
  } catch (error) {
    console.error("Failed to parse options from local storage:", error)
    return defaultOptions
  }
}

export const options = store<Options>(getInitialOptions())

useEffect(() => {
  const serializedOptions = JSON.stringify(options)
  localStorage.setItem("options", serializedOptions)
  console.debug("Updated saved options:", serializedOptions)
})

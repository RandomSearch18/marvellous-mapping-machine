import { store, useEffect } from "voby"

export type Options = {
  /** Frontend-only options */
  app: {
    weightOverlay: boolean
  }
}

export const optionsStore = store<Options>({
  app: {
    weightOverlay: true,
  },
})

useEffect(() => {
  const options = optionsStore
  console.debug("Options store:", JSON.stringify(options))
})

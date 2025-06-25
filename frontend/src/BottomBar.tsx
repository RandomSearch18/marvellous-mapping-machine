import { $, For, useEffect, useMemo } from "voby"

function BottomBar() {
  function onClick(event: MouseEvent) {
    // Get the button element that was clicked on
    const eventTarget = event.target as HTMLElement
    const button = eventTarget.closest("button")
    if (!button) {
      throw new Error("Couldn't find button that was clicked on")
    }
    // Update the active screen to whichever screen our button corresponds to
    const screenName = button.textContent!
    activeScreen(screenName)
  }

  // Source of truth for the current active screen. "Map" is the default screen.
  const activeScreen = $("Map")
  // A map of botton names to observables representing their active state
  const bottomBarButtons = Object.fromEntries(
    ["Map", "Route", "Options", "Reels"].map((name) => [
      name,
      useMemo(() => activeScreen() === name),
    ])
  )
  // e.g. appending #Route to the URL should set the default screen to the Route screen
  const screenFromHash = window.location.hash.slice(1)
  if (screenFromHash in bottomBarButtons) activeScreen(screenFromHash)

  useEffect(() => {
    // This is a handler function for when the active screen changes
    const newActiveScreen = activeScreen()

    // Make the new active screen visible and hide the old one
    const oldScreenElement = document.querySelector("#active-screen")
    const newScreenElement = document.querySelector(
      `[data-screen="${newActiveScreen.toLowerCase()}"]`
    )
    if (!newScreenElement) {
      throw new Error(`No screen found for ${newActiveScreen}`)
    }
    if (oldScreenElement) {
      oldScreenElement.id = ""
    } else {
      console.warn("No active screen to deactivate")
    }
    newScreenElement.id = "active-screen"
  })

  return (
    <div class="btm-nav static flex-none" id="bottom-bar" onClick={onClick}>
      <For values={Object.entries(bottomBarButtons)}>
        {([name, active]) => <BottomBarButton active={active} name={name} />}
      </For>
    </div>
  )
}

function BottomBarButton({
  active,
  name,
}: {
  active: () => boolean
  name: string
}) {
  return (
    <button
      class={() =>
        active()
          ? "active border-t-4 border-pink-800 bg-pink-200 text-pink-800"
          : "bg-pink-100 text-pink-800"
      }
    >
      <span class="btm-nav-label">{name}</span>
    </button>
  )
}

export default BottomBar

function BottomBar() {
  function onClick(event: MouseEvent) {
    const eventTarget = event.target as HTMLElement
    const button = eventTarget.closest("button")
    const bottomBar = eventTarget.closest("#bottom-bar")
    if (!button)
      return console.warn("Handling bottom bar click event without a button")
    if (!bottomBar)
      return console.warn("Bottom button without a bottom bar was clicked")
    // if (target.classList.contains("active")) return
    const oldActiveButton = bottomBar.querySelector(".active")
    if (oldActiveButton) {
      oldActiveButton.classList.remove("active")
      oldActiveButton.classList.remove("border-pink-600")
      oldActiveButton.classList.remove("bg-pink-200")
      oldActiveButton.classList.remove("border-t-4")
      oldActiveButton.classList.add("bg-pink-100")
    } else {
      console.warn("No active button to deactivate")
    }
    button.classList.add("active")
    button.classList.add("border-pink-600")
    button.classList.add("bg-pink-200")
    button.classList.add("border-t-4")
    button.classList.remove("bg-pink-100")

    const activeScreen = document.querySelector("#active-screen")
    const nextScreen = document.querySelector(
      `[data-screen="${button.innerText.toLowerCase()}"]`
    )
    if (!nextScreen) {
      throw new Error(`No screen found for ${button.innerText}`)
    }
    if (activeScreen) {
      activeScreen.id = ""
    } else {
      console.warn("No active screen to deactivate")
    }
    nextScreen.id = "active-screen"
  }

  return (
    <div class="btm-nav" id="bottom-bar" onClick={onClick}>
      <button class="active border-t-4 border-pink-800 bg-pink-200 text-pink-800">
        <span class="btm-nav-label">Map</span>
      </button>
      <button class="bg-pink-100 text-pink-800">
        <span class="btm-nav-label">Route</span>
      </button>
      <button class="bg-pink-100 text-pink-800">
        <span class="btm-nav-label">Options</span>
      </button>
    </div>
  )
}

export default BottomBar
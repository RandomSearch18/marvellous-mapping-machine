const bottomBar = document.querySelector("#bottom-bar")!

bottomBar.addEventListener("click", (event) => {
  const eventTarget = event.target as HTMLElement
  const button = eventTarget.closest("button")
  if (!button) {
    console.warn("Handling bottom bar click event without a button")
    return
  }
  // if (target.classList.contains("active")) return
  const oldActiveButton = bottomBar.querySelector(".active")
  if (oldActiveButton) {
    oldActiveButton.classList.remove("active")
    oldActiveButton.classList.remove("border-pink-600")
  } else {
    console.warn("No active button to deactivate")
  }
  button.classList.add("active")
  button.classList.add("border-pink-600")

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
})

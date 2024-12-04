const bottomBar = document.querySelector("#bottom-bar")!

bottomBar.addEventListener("click", (event) => {
  const target = event.target as HTMLElement
  // if (target.classList.contains("active")) return
  const activeButton = bottomBar.querySelector(".active")
  if (activeButton) {
    activeButton.classList.remove("active")
    activeButton.classList.remove("border-pink-600")
  } else {
    console.warn("No active button to deactivate")
  }
  target.classList.add("active")
  target.classList.add("border-pink-600")

  const activeScreen = document.querySelector("#active-screen")
  const nextScreen = document.querySelector(
    `[data-screen="${target.innerText.toLowerCase()}"]`
  )
  if (!nextScreen) {
    throw new Error(`No screen found for ${target.innerText}`)
  }
  if (activeScreen) {
    activeScreen.id = ""
  } else {
    console.warn("No active screen to deactivate")
  }
  nextScreen.id = "active-screen"
})

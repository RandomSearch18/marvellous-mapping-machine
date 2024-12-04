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
})

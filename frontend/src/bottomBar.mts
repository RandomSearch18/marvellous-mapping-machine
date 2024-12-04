const bottomBar = document.querySelector("#bottom-bar")!

bottomBar.addEventListener("click", (event) => {
  const target = event.target as HTMLElement
  if (target.classList.contains("active")) return
  const activeButton = bottomBar.querySelector(".active")
  activeButton?.classList.remove("active")
  target.classList.add("active")
})

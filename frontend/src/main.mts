import leaflet from "leaflet"
import "leaflet/dist/leaflet.css"

const mainMap = leaflet.map("main-map").setView([51.27556, -0.37834], 15)

leaflet
  .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: `&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>`,
  })
  .addTo(mainMap)

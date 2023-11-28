import "./discord/index"
import { roomsScrap, startSchedulers } from "./schedulers"

// ------ TEST ------
roomsScrap().then(() => process.exit(0)).catch(e => {
  console.error(e)
  process.exit(1)
})

// ------ PROD ------

startSchedulers()

import "./discord/index"
import { modulesScrap, startSchedulers } from "./schedulers"

// ------ TEST ------
modulesScrap().then(() => process.exit(0)).catch(e => {
  console.error(e)
  process.exit(1)
})

// ------ PROD ------

// startSchedulers()

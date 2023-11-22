import { getSyncedPromos } from "./sql/objects/sourceUser"
import { fetchModulesForPromo } from "./intra/modules"
import connector from "./sql/connector"
import Module from "./sql/objects/module"
import { fetchActivitiesForModule } from "./intra/activities"
import Activity from "./sql/objects/activity";

(async () => {
  const syncedPromos = await getSyncedPromos()
  console.log("Synced promos: " + syncedPromos.join(", "))
  const modulesSynced = []
  for (const promo of syncedPromos) {
    console.log(`Fetching ${promo}`)
    const modules = await fetchModulesForPromo(promo)
    for (const m of modules) {
      const result = await connector.insertOrUpdate(Module, m, {id: m.id})
      if (result) {
        if (result.isDiff) {
          console.log(`Updated ${m.name} (${m.code})`)
        } else {
          console.log(`No diff for ${m.name} (${m.code})`)
        }
      } else {
        console.log(`Inserted ${m.name} (${m.code})`)
      }
    }
    modulesSynced.push(...modules)
  }
  for (const module of modulesSynced) {
    const activities = await fetchActivitiesForModule(module)
    for (const a of activities) {
      const result = await connector.insertOrUpdate(Activity, a, {id: a.id})
      if (result) {
        if (result.isDiff) {
          console.log(`Updated ${a.name} (${a.id})`)
        } else {
          console.log(`No diff for ${a.name} (${a.id})`)
        }
      } else {
        console.log(`Inserted ${a.name} (${a.id})`)
      }
    }
    // Wait a bit to avoid getting banned
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
})()

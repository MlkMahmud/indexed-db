
import { openDB } from 'https://cdn.jsdelivr.net/npm/idb@7/+esm';

let db;

// ideally pass a version property from the main thread so we know which version of the database to use.
async function initDB() {
  if (!db) {
    db = await openDB("order", 3, {
      // This function is invoked when the provided version paramter is higher than the ccurrent database version.
      // We should probably only update database versions when there's been a significant schema change.
      // If the store already exists, clear all the data in it. 
      upgrade(_db) {
        if (!_db.objectStoreNames.contains("employees")) {
          _db.createObjectStore("employees", { keyPath: "id" }); 
        }
      }, 
    })
  }
  return db;
}

self.onmessage = (async (e) => {
  const db = await initDB();
  const store = db.transaction("employees", "readwrite").objectStore("employees");
  const data = JSON.parse(e.data);
  const employee = await store.get(data.id);
  
  if (!employee) {
    await store.add(data);
    return;
  }

  await store.put(data);
});
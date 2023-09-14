const dotenv = require("dotenv")
dotenv.config()
const makeApp = require("./makeApp")
const db = require("./databaseLogic/mongoDbCarts")
const dbUrl = "mongodb://127.0.0.1:27017/react_clothing_store_db"
const app = makeApp(db, {})

app.listen(5000, async (e) => {
    db.connectToDatabase(dbUrl)
    if (e) throw err;
    console.log(`Listening on port 5000`);
})
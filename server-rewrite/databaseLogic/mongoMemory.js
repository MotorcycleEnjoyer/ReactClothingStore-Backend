const mongoose = require("mongoose")
const { MongoMemoryServer } = require("mongodb-memory-server")

let mongod

async function connect() {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri)
}

async function cleanData() {
    await mongoose.connection.db.dropDatabase()
}

async function disconnect(){
    await mongoose.disconnect()
    await mongod.stop()
}
module.exports = {connect, disconnect, cleanData}
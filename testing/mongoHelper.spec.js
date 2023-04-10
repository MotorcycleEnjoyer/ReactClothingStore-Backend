// const mongoHelper = require("../mongoHelper.js")
const { connect, disconnect } = require("./helpers/mongoMemory.js")
const User = require("../databaseLogic/User.js")
const userFixtures = require("./helpers/fixtures/UserFixtures.js")

describe("mongodb USER tests", () => {
    beforeAll(connect)
    afterAll(disconnect)

    test("expect createUser to insert new record", async () => {
        const details = {
            username: "Bob", 
            password: "Joe",
            reviews: [],
            shoppingCart: []
        }

        await User.createAndReturnUser(details)
        const person = await User.getUser("Bob")
        expect(person).toEqual(expect.objectContaining({
            ...details,
            _id: expect.anything(),
            __v: expect.anything()
        }))
    })

    test("expect addToCart to insert new record into cart", async() => {
        await User.addToCart(userFixtures.productOne, "Bob")
        
        const person = await User.getUser("Bob")
        const shoppingCart = person.shoppingCart
        expect(shoppingCart).toEqual([{...userFixtures.productOne, amount: 1}])
    })

    test("expect adding IDENTICAL RECORD to increment an existing record", async() => {
        await User.addToCart(userFixtures.productOne, "Bob")

        const person = await User.getUser("Bob")
        const shoppingCart = person.shoppingCart
        expect(shoppingCart).toEqual([{...userFixtures.productOne, amount: 2}])
    })

    test("expect adding different item to not overwrite existing", async() => {
        await User.addToCart(userFixtures.productTwo, "Bob")

        const person = await User.getUser("Bob")
        const shoppingCart = person.shoppingCart
        expect(shoppingCart).toEqual([{...userFixtures.productOne, amount: 2}, userFixtures.productTwo])
    })

    test("expect deleteCartItem to delete ONLY the specified item", async() => {
        await User.deleteCartItem(0, "Bob")

        const person = await User.getUser("Bob")
        const shoppingCart = person.shoppingCart
        expect(shoppingCart).toEqual([userFixtures.productTwo])
    })
})



describe("Second Set of Tests", () => {
    beforeAll(connect)
    afterAll(disconnect)

    test("Expect all records of First set to not exist", async () => {
        const person = await User.getUser("Bob")

        expect(person).toBeNull()
    })
})
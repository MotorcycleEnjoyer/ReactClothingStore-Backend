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

    test("expect [editing B to become A], to [delete B] and [increment A]", async () => {
        // arrange
        let productId, oldUserChoices, newUserChoices, index, amount

        productId = userFixtures.productTwo.details.id
        oldUserChoices = userFixtures.productTwo.userSelectedParameters
        newUserChoices = userFixtures.productOne.userSelectedParameters
        index = 1
        amount = 25
        const dataObject = {productId, oldUserChoices, newUserChoices, index, amount}

        // act
        await User.editCartItem(dataObject, "Bob")
        const person = await User.getUser("Bob")
        const shoppingCart = person.shoppingCart

        // assert
        expect(shoppingCart).toEqual([{...userFixtures.productOne, amount: 27}])
    })

    test("expect deleteCartItem to delete specified item", async() => {
        await User.addToCart(userFixtures.productTwo, "Bob")
        const setupPerson = await User.getUser("Bob")
        const setupShoppingCart = setupPerson.shoppingCart
        expect(setupShoppingCart).toEqual([{...userFixtures.productOne, amount:27}, userFixtures.productTwo])
        

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
const { connect, disconnect } = require("./helpers/mongoMemory.js")
const User = require("../databaseLogic/User.js")
const Anon = require("../databaseLogic/Anonymous.js")
const userFixtures = require("./helpers/fixtures/UserFixtures.js")

/* describe("mongodb USER MODEL tests", () => {
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
}) */



describe("mongodb ANONYMOUS MODEL tests", () => {
    beforeAll(connect)
    afterAll(disconnect)

    test("Expect all records of First set to not exist", async () => {
        const person = await User.getUser("Bob")

        expect(person).toBeNull()
    })

    test("Expect createAnon to return an ID and empty cart", async () => {
        // Arrange
        const payload = {
            temporaryAnonCookie: "b83085ae-b8ca-488a-870c-0c5527da62fb",
            shoppingCart: []
        }
        
        // Act
        await Anon.createAndReturnUser(payload)
        const response = await Anon.getUser(payload.temporaryAnonCookie)
        // Assert
        const { temporaryAnonCookie, shoppingCart } = response
        expect(temporaryAnonCookie).toEqual(payload.temporaryAnonCookie)
        expect(shoppingCart).toEqual([])
    })

    test("expect addToCart to insert new record into cart", async () => {
        // Arrange
        const temporaryAnonCookie = "b83085ae-b8ca-488a-870c-0c5527da62fb"
        
        // Act
        await Anon.addToCart(userFixtures.productOne, temporaryAnonCookie)
        const anon = await Anon.getUser(temporaryAnonCookie)

        // Assert
        expect(anon.shoppingCart).toEqual([{...userFixtures.productOne, amount: 1}])
    })

    test("expect adding IDENTICAL record to increment cart amount", async () => {
        // Arrange
        const temporaryAnonCookie = "b83085ae-b8ca-488a-870c-0c5527da62fb"
        
        // Act
        await Anon.addToCart(userFixtures.productOne, temporaryAnonCookie)
        const anon = await Anon.getUser(temporaryAnonCookie)

        // Assert
        expect(anon.shoppingCart).toEqual([{...userFixtures.productOne, amount: 2}])
    })

    test("expect adding different item to not overwrite existing", async() => {
        // Arrange
        const temporaryAnonCookie = "b83085ae-b8ca-488a-870c-0c5527da62fb"
                
        // Act
        await Anon.addToCart(userFixtures.productTwo, temporaryAnonCookie)
        const anon = await Anon.getUser(temporaryAnonCookie)

        // Assert
        expect(anon.shoppingCart).toEqual([{...userFixtures.productOne, amount: 2}, userFixtures.productTwo])
    })

    test("expect [editing B to become A], to [delete B] and [increment A]", async () => {
        // arrange
        const temporaryAnonCookie = "b83085ae-b8ca-488a-870c-0c5527da62fb"
        let productId, oldUserChoices, newUserChoices, index, amount

        productId = userFixtures.productTwo.details.id
        oldUserChoices = userFixtures.productTwo.userSelectedParameters
        newUserChoices = userFixtures.productOne.userSelectedParameters
        index = 1
        amount = 25
        const dataObject = {productId, oldUserChoices, newUserChoices, index, amount}

        // act
        await Anon.editCartItem(dataObject, temporaryAnonCookie)
        const person = await Anon.getUser(temporaryAnonCookie)
        const shoppingCart = person.shoppingCart

        // assert
        expect(shoppingCart).toEqual([{...userFixtures.productOne, amount: 27}])
    })

    test("expect deleteCartItem to delete specified item", async() => {
        const temporaryAnonCookie = "b83085ae-b8ca-488a-870c-0c5527da62fb"
        await Anon.addToCart(userFixtures.productTwo, temporaryAnonCookie)
        const setupPerson = await Anon.getUser(temporaryAnonCookie)
        const setupShoppingCart = setupPerson.shoppingCart
        expect(setupShoppingCart).toEqual([{...userFixtures.productOne, amount:27}, userFixtures.productTwo])
        

        await Anon.deleteCartItem(0, temporaryAnonCookie)

        const person = await Anon.getUser(temporaryAnonCookie)
        const shoppingCart = person.shoppingCart
        expect(shoppingCart).toEqual([userFixtures.productTwo])
    })
})
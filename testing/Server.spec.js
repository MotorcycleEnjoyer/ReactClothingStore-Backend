const app = require("../Server")
const request = require('supertest');
const {searchResults, shoppingCarts, addToCart} = require("./helpers/fixtures/HTTP_fixtures")
const uuidv4 = require("uuid").v4

/* 

test('GET /test responds with hello world', async () => {
  // arrange
  const api = request(app);

  // act
  const response = await api.get('/test');

  // assert
  expect(response.statusCode).toEqual(200);
  expect(response.body).toEqual({ hello: 'world' })
});

test('POST [/backend/suggestions] returns suggestion results array of strings', async () => {
  // arrange
  const api = request(app)
  const endpoint = "/backend/suggestions"

  const payload = {searchTerm: "Shirt"}
  const expectedResponse = ["Generic T Shirt", "Specific T Shirt", "Some T Shirt"]

  const fiftyCharPayload = {searchTerm: "LoremIpsumLoremIpsumLoremIpsumLoremIpsumLoremIpsum"}
  
  // act
  const response = await api.post(endpoint).send(payload)
  const fiftyCharResponse = await api.post(endpoint).send(fiftyCharPayload)

  // assert
  expect(response.body).toEqual(expectedResponse)
  expect(fiftyCharResponse.body).toEqual([])
})

test('POST [/backend/suggestions] returns code 500 upon invalid query ', async () => {
  // arrange
  const api = request(app)
  const endpoint = "/backend/suggestions"

  const undefinedPayload = undefined
  const fiftyOneCharPayload = {searchTerm: "LoremIpsumLoremIpsumLoremIpsumLoremIpsumLoremIpsum5"}
  const nonNumericAlphabeticPayload = {searchTerm: "abc123@#$%^&!@)((*"}
  const emptyPayload = {searchTerm: ""}

  // act
  const undefinedResponse = await api.post(endpoint).send(undefinedPayload)
  const fiftyOneCharReponse = await api.post(endpoint).send(fiftyOneCharPayload)
  const invalidCharResponse = await api.post(endpoint).send(nonNumericAlphabeticPayload)
  const emptyResponse = await api.post(endpoint).send(emptyPayload)

  // assert
  expect(undefinedResponse.statusCode).toEqual(500)
  expect(fiftyOneCharReponse.statusCode).toEqual(500)
  expect(invalidCharResponse.statusCode).toEqual(500)
  expect(emptyResponse.statusCode).toEqual(500)
})

test("GET [/backend/s] returns search results array of objects", async() => {
  // arrange
  const api = request(app)
  const baseURL = "/backend/s?k="
  const shirtSearch = `${baseURL}shirt`
  const genericSearch = `${baseURL}generic`

  // act
  const shirtResponse = await api.get(shirtSearch)
  const genericResponse = await api.get(genericSearch)

  // assert
  expect(shirtResponse.body).toEqual(searchResults.shirt)
  expect(genericResponse.body).toEqual(searchResults.generic)
})

test("GET [/backend/s] returns code 500 upon invalid query", async() => {
  // arrange
  const api = request(app)
  const baseURL = "/backend/s?k="

  const undefinedPayload = `${baseURL}`
  const fiftyOneCharPayload = `${baseURL}LoremIpsumLoremIpsumLoremIpsumLoremIpsumLoremIpsum5`
  const nonNumericAlphabeticPayload = `${baseURL}abc123@#$%^&!@)((*`

  // act
  const undefinedResponse = await api.get(undefinedPayload)
  const fiftyOneCharReponse = await api.get(fiftyOneCharPayload)
  const invalidCharResponse = await api.get(nonNumericAlphabeticPayload)

  // assert
  expect(undefinedResponse.statusCode).toEqual(500)
  expect(fiftyOneCharReponse.statusCode).toEqual(500)
  expect(invalidCharResponse.statusCode).toEqual(500)
})

test("GET [/backend/shoppingCart] gives cookie if unassigned", async () =>{
  // arrange
  const api = request(app)
  // act
  const response = await api.get("/backend/shoppingCart")
  const cookie = response.headers["set-cookie"]

  // assert
  expect(response.body).toEqual(shoppingCarts.empty)
  expect(cookie).not.toBeNull()

  const secondResponse = await api.get("/backend/shoppingCart").set("Cookie", cookie)
  expect(secondResponse.headers["set-cookie"]).toEqual(undefined)
})

test("POST [/backend/addToCart] adds an item to cart, when you have a cookie assigned to it.", async () =>{
  // arrange
  const api = request(app)
  const newCookie = (await api.get("/backend/shoppingCart")).headers["set-cookie"]

  // act
  const noCookieResponse = await api.post("/backend/addToCart").send(addToCart.sampleOneRequest)
  const cookieResponse = await api.post("/backend/addToCart").send(addToCart.sampleOneRequest).set("Cookie", newCookie)

  // assert
  expect(noCookieResponse.statusCode).toEqual(500)
  expect(cookieResponse.body).toEqual(addToCart.sampleOneResponse)
}) 

test("REGISTERING -> ADDING TO CART -> LOGGING OFF -> LOGGING IN, returns proper cart ", async () => {
  // arrange
  const api = request(app)
  await api.get("/test")
  const newCookie = (await api.get("/backend/shoppingCart")).headers["set-cookie"]
  // password must be at least 8 characters lmao
  const creds = {username: "John", password: "DoeDoeDoe"}

  expect(newCookie).not.toBe(undefined)

// act
  const registrationResponse = await api.post("/backend/register").send(creds).set("Cookie", newCookie)
  const regCookie = registrationResponse.headers["set-cookie"]
  await api.post("/backend/addToCart").send(addToCart.sampleOneRequest).set("Cookie", regCookie)

  const logoutResponse = await api.post("/backend/logout").set("Cookie", regCookie)
  const logCookie = logoutResponse.headers["set-cookie"]

  const loginResponse = await api.post("/backend/login").send(creds).set("Cookie", logCookie)
  const finalCookie = loginResponse.headers["set-cookie"]

  const finalCart = await api.get("/backend/shoppingCart").set("Cookie", finalCookie)

  // assert
  expect(finalCart.body).toEqual(addToCart.sampleOneUserResponse)
})
+
*/

test.todo("Registering with same username causes failure")
test.todo("Accessing UserData page returns a user data object if logged in, or You must log in.")
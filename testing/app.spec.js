const app = require("../Server")
const request = require('supertest');

test('GET /test responds with hello world', async () => {
  // arrange
  const api = request(app);

  // act
  const response = await api.get('/test');

  // assert
  expect(response.statusCode).toEqual(200);
  expect(response.body).toEqual({ hello: 'world' })
});

test('POST /backend/suggestions responds with array of suggestions', async () => {
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

test('POST /backend/suggestions searchTerm(undefined || len>50 || len==0 || InvalidChars) returns error 500', async () => {
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
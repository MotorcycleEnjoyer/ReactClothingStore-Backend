const app = require("../Server")
const request = require('supertest');
/* const express = require("express")
const fakeApp = express()

fakeApp.get("/", (req, res) => {
  res.json({hello: "world"})
}) */

test('GET /test responds with hello world', async () => {
  // arrange
  const api = request(app);

  // act
  const response = await api.get('/test');

  // assert
  expect(response.statusCode).toEqual(200);
  expect(response.body).toEqual({ hello: 'world' })
});

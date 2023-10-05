# ReactClothingStore-Backend
Server for the clothing store, being redone.

Current Functionality:
  - Upon startup, server will load Sessions
  - Upon connection, server creates a session and sends it to client via cookie.
  - Upon registration / login, server deletes previous session and creates a User session.
  - Can Add/Edit/Delete items within cart
  
Uses Express for http middleware

Uses Bcrypt for hashing/salting passwords during registration, and for authentication

Uses MongoDB to store the carts and products.


Functionality to add:
  - Ratings / Reviews
  - Pagination
  - API versioning (/api/v1/blabla)
  - "Checkout"
  - Order History

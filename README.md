# ReactClothingStore-Backend
Server for the clothing store. HTTP endpoints and cart logic (add, edit, remove)

Functionality:
  - Upon startup, server will load Sessions and Star Rating Averages.
  - Upon visiting site, server creates a cart and stores in MongoDB. The ID of the cart (UUIDV4) is sent as a cookie to user and stored in Sessions Object.
  - Any time a user visits domain with cookie currently in Sessions Object, we retrieve their specific cart.
  - All users (anonymous/logged in) can modify their carts (addToCart, editItem, removeItem, getCart).
  - Upon Registering, the old temporary cart by cookie is purged and a User Object is created in MongoDB. Stores creds, ratings, reviews, cart.
  - Logging in / Registering stores a userId in sessions Object for retrieving cart in MongoDB
  - Logging in / Logging out has no impact on user cart.
  - A User has permissions to create reviews and star ratings for products. Anon can see reviews and star rating average, but cannot make their own.
  - SEARCH: When typing in main searchbar, server will respond with suggestions with regex lookups of suggestionDB.
  - SEARCH: When submitting main searchbar, server will respond with products found by regex lookup.
  
  
Uses FS.writeFile and loadFile for saving / importing JSON data, like Session Object and Star Ratings Object.

Uses a local MongoDB (Not cloud) for:
  - Storing User / Anonymous Shopping Carts
  - Storing Reviews / Star Ratings
  
Uses Express for http middleware

Uses Bcrypt for hashing/salting passwords during registration, and for authentication

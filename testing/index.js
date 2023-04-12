const dotenv = require("dotenv")
dotenv.config()
let port
if(process.env.NODE_ENV === "production") {
  port = process.env.PRODUCTION_PORT
} else {
  port = process.env.TESTING_PORT
}
const app = require("../Server")

app.listen(port, (e) => {
  if (e) throw err;
  console.log(`Listening on port ${port}`);
});

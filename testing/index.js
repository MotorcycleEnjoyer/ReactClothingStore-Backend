const PORT = process.env.PORT || 5000;
const app = require("../Server")

app.listen(PORT, (e) => {
  if (e) throw err;
  console.log(`Listening on port ${PORT}`);
});

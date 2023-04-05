const PORT = process.env.PORT || 3000;
import app, { appStartup } from '../Server.js'

/* app.listen(PORT, (e) => {
  if (e) throw err;
  console.log(`Listening on port ${PORT}`);
}); */

appStartup()
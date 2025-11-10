import "dotenv/config";
import { createServer } from ".";

const PORT = Number(process.env.PORT ?? 3000);
const app = createServer();

app.listen(PORT, () => {
  console.log(`[standalone] Express listening on http://localhost:${PORT}`);
});



import { initServer } from "./app";
import dotenv from "dotenv";
dotenv.config();
const init = async () => {
  const app = await initServer();
  app.listen(8000, () => console.log("server is listening on 8000"));
};

init();
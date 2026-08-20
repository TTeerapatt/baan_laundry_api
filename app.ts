import express from "express";
import path from "path";
import router from "./src/routes";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
 
const PORT = process.env.PORT || 3001;

// app.use(
//   "/2026/1024_laroche_ticket/img",
//   express.static(path.resolve(__dirname, "../img"))
// );

// app.use("/2025/0923_eef_webgame/img");
 
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(bodyParser.json());

app.use(
  "/upload",
  express.static(path.resolve(__dirname, "upload"))
);

app.use("/", router);
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

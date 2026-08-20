import cors from "cors";
import express from "express";
import path from "path";
import dotenv from "dotenv";
import router from "./routes";

dotenv.config();

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
const allowedOrigins = corsOrigin.split(",").map((origin) => origin.trim());
const useWildcardOrigin = allowedOrigins.includes("*");

app.use(
  cors({
    origin: useWildcardOrigin ? "*" : allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: !useWildcardOrigin,
  })
);
app.use(express.json());

app.use("/upload", express.static(path.resolve(process.cwd(), "upload")));

app.use("/laundry/api", router);

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/laundry/api`);
  console.log(`Check health on http://localhost:${PORT}/laundry/api/health`);
});

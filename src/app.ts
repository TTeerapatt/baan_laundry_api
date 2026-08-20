import cors from "cors";
import express from "express";
import path from "path";
import dotenv from "dotenv";
import authRouter from "./routes/auth.route";
import usersRouter from "./routes/users.route";
import adminsRouter from "./routes/admins.route";
import serviceTypeRouter from "./routes/service_type.route";
import listTypeRouter from "./routes/list_type.route";
import listPriceRouter from "./routes/list_price.route";
import ordersRouter from "./routes/orders.route";
import orderItemsRouter from "./routes/order_items.route";
import orderLogRouter from "./routes/order_log.route";

dotenv.config();

const app = express();
const API_PREFIX = "/laundry/api";

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

app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Laundry API is running",
  });
});

app.use(`${API_PREFIX}/auth`, authRouter);
app.use(`${API_PREFIX}/users`, usersRouter);
app.use(`${API_PREFIX}/admins`, adminsRouter);
app.use(`${API_PREFIX}/service-type`, serviceTypeRouter);
app.use(`${API_PREFIX}/list-type`, listTypeRouter);
app.use(`${API_PREFIX}/list-price`, listPriceRouter);
app.use(`${API_PREFIX}/orders`, ordersRouter);
app.use(`${API_PREFIX}/order-items`, orderItemsRouter);
app.use(`${API_PREFIX}/order-log`, orderLogRouter);

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log("--------------------------------------------------------");
  console.log(`Server running on http://localhost:${PORT}${API_PREFIX}`);
  console.log(`Check health on http://localhost:${PORT}${API_PREFIX}/health`);
  console.log("--------------------------------------------------------");
});

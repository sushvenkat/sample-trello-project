import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import dotenv from "dotenv";

dotenv.config();
const SECRET = process.env.JWT_SECRET || "supersecretkey";

const router = Router();

// Signup
router.post("/signup", async (req: Request, res: Response) => {
  console.log("Inside signup******");
  const { email, password } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return res.status(400).json({ error: "User exists" });

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, password: hashed } });

  res.json({ message: "User created" });
});

// Login
router.post("/login", async (req: Request, res: Response) => {
  console.log("Inside login******");

  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  console.log("user data found:", user);
  if (!user || !user.password) return res.status(400).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  console.log("valid", valid);
  if (!valid) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, email: user.email }, SECRET, { expiresIn: "1d" });
  res.json({ token });
});

export default router;
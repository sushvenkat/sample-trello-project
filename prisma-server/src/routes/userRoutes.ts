import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const userRouter = Router();

// GET /users
userRouter.get("/", async (req: Request, res: Response) => {
  try {
    console.log("Fetching users*******");
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(users);
  } catch (error) {
    console.error("Fetch Users Error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default userRouter;
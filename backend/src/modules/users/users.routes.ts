import { Router, type Request } from "express";
import { prisma } from "../../prisma/client.js";
import type { AuthRequest } from "../../middleware/authMiddleware.js";

const router = Router();

/** GET /users — list tenant users (id, name, email) for assignee/owner dropdowns */
router.get("/", async (req: Request & AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const users = await prisma.user.findMany({
      where: { tenantId, status: "active" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    res.json(users);
  } catch (e) {
    next(e);
  }
});

export default router;

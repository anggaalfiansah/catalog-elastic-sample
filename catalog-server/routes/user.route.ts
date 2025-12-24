import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { adminMiddleware } from "../middlewares/role.middleware";

const router = Router();

// Semua route di bawah ini wajib LOGIN (Token Valid)
router.use(authMiddleware);

// Route yang bisa diakses oleh ADMIN & STAFF (hanya baca)
router.get("/", UserController.getAll);
router.get("/:id", UserController.getOne);

// Route KHUSUS ADMIN (Create, Update, Delete)
router.post("/", adminMiddleware, UserController.create);
router.put("/:id", adminMiddleware, UserController.update);
router.delete("/:id", adminMiddleware, UserController.delete);

export default router;

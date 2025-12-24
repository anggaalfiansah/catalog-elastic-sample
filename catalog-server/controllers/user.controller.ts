import type { Request, Response } from "express";
import { UserService } from "../services/user.service";

export const UserController = {
  getAll: async (req: Request, res: Response) => {
    const users = await UserService.findAll();
    res.json({ success: true, data: users });
  },

  getOne: async (req: Request, res: Response) => {
    try {
      const user = await UserService.findById(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ success: true, data: user });
    } catch (e) {
      res.status(500).json({ error: "Error fetching user" });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const user = await UserService.create(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const user = await UserService.update(req.params.id, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      res.status(500).json({ error: "Gagal update user" });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      await UserService.delete(req.params.id);
      res.json({ success: true, message: "User deleted" });
    } catch (error) {
      res.status(500).json({ error: "Gagal hapus user" });
    }
  }
};
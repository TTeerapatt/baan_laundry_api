import type { Request, Response, NextFunction } from "express";
import {
  UserError,
  createUser,
  getActiveUserById,
  getActiveUsers,
  hardDeleteUser,
  softDeleteUser,
  updateUser,
} from "../services/users.service";

function parseIdParam(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function handleUserError(
  error: unknown,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof UserError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }
  next(error);
}

export async function getUsersController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const phoneRaw = req.query.phone;
    const phone = Array.isArray(phoneRaw)
      ? phoneRaw[0] !== undefined
        ? String(phoneRaw[0])
        : undefined
      : phoneRaw !== undefined
        ? String(phoneRaw)
        : undefined;

    const users = await getActiveUsers({ phone });
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    handleUserError(error, res, next);
  }
}

export async function getUserByIdController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseIdParam(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        message: "Invalid id",
      });
      return;
    }

    const user = await getActiveUserById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function createUserController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await createUser({
      phone: req.body?.phone,
      name: req.body?.name,
      note: req.body?.note,
      adminId: req.admin?.adminId ?? null,
    });

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    handleUserError(error, res, next);
  }
}

export async function updateUserController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseIdParam(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        message: "Invalid id",
      });
      return;
    }

    const user = await updateUser(id, {
      phone: req.body?.phone,
      name: req.body?.name,
      note: req.body?.note,
      adminId: req.admin?.adminId ?? null,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    handleUserError(error, res, next);
  }
}

export async function softDeleteUserController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseIdParam(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        message: "Invalid id",
      });
      return;
    }

    const user = await softDeleteUser(id, req.admin?.adminId ?? null);
    res.status(200).json({
      success: true,
      message: "User soft deleted",
      data: user,
    });
  } catch (error) {
    handleUserError(error, res, next);
  }
}

export async function hardDeleteUserController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = parseIdParam(req.params.id);
    if (id === null) {
      res.status(400).json({
        success: false,
        message: "Invalid id",
      });
      return;
    }

    const result = await hardDeleteUser(id, req.admin?.adminId ?? null);
    res.status(200).json({
      success: true,
      message: "User hard deleted",
      data: result,
    });
  } catch (error) {
    handleUserError(error, res, next);
  }
}

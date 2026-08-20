import type { NextFunction, Request, Response } from "express";
import {
  AuthError,
  createAdmin,
  loginAdmin,
} from "../services/auth.service";

export async function createAdminController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await createAdmin({
      email: req.body?.email,
      password: req.body?.password,
      display_name: req.body?.display_name,
      role: req.body?.role,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
}

export async function loginAdminController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await loginAdmin({
      email: req.body?.email,
      password: req.body?.password,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }
    next(error);
  }
}

export async function getMeController(
  req: Request,
  res: Response
): Promise<void> {
  res.status(200).json({
    success: true,
    data: req.admin ?? null,
  });
}

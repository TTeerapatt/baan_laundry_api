import type { Request, Response, NextFunction } from "express";
import {
  ListTypeError,
  createListType,
  getActiveListTypeById,
  getActiveListTypes,
  hardDeleteListType,
  softDeleteListType,
  updateListType,
} from "../services/list_type.service";

function parseIdParam(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function handleListTypeError(
  error: unknown,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof ListTypeError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }
  next(error);
}

export async function getListTypesController(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const listTypes = await getActiveListTypes();
    res.status(200).json({
      success: true,
      data: listTypes,
    });
  } catch (error) {
    next(error);
  }
}

export async function getListTypeByIdController(
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

    const listType = await getActiveListTypeById(id);
    if (!listType) {
      res.status(404).json({
        success: false,
        message: "List type not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: listType,
    });
  } catch (error) {
    next(error);
  }
}

export async function createListTypeController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const listType = await createListType({
      code: req.body?.code,
      name: req.body?.name,
      size: req.body?.size,
      adminId: req.admin?.adminId ?? null,
    });

    res.status(201).json({
      success: true,
      data: listType,
    });
  } catch (error) {
    handleListTypeError(error, res, next);
  }
}

export async function updateListTypeController(
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

    const listType = await updateListType(id, {
      code: req.body?.code,
      name: req.body?.name,
      size: req.body?.size,
      adminId: req.admin?.adminId ?? null,
    });

    res.status(200).json({
      success: true,
      data: listType,
    });
  } catch (error) {
    handleListTypeError(error, res, next);
  }
}

export async function softDeleteListTypeController(
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

    const listType = await softDeleteListType(id, req.admin?.adminId ?? null);
    res.status(200).json({
      success: true,
      message: "List type soft deleted",
      data: listType,
    });
  } catch (error) {
    handleListTypeError(error, res, next);
  }
}

export async function hardDeleteListTypeController(
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

    const result = await hardDeleteListType(id, req.admin?.adminId ?? null);
    res.status(200).json({
      success: true,
      message: "List type hard deleted",
      data: result,
    });
  } catch (error) {
    handleListTypeError(error, res, next);
  }
}

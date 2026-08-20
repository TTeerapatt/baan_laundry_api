import type { Request, Response, NextFunction } from "express";
import {
  getActiveListTypeById,
  getActiveListTypes,
} from "../services/list_type.service";

function parseIdParam(value: string): number | null {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
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

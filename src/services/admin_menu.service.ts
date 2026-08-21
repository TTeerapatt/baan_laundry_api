import pool from "../config/database.config";

export interface AdminMenuLabelListItem {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AdminMenuTabListItem {
  id: number;
  menu_label_id: number;
  menu_label_code: string;
  menu_label_name: string;
  code: string;
  name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AdminMenuResponse {
  labels: AdminMenuLabelListItem[];
  tabs: AdminMenuTabListItem[];
}

export async function getAdminMenuLabels(): Promise<AdminMenuLabelListItem[]> {
  const result = await pool.query<AdminMenuLabelListItem>(
    `
      SELECT
        id, code, name, is_active, sort_order, created_at, updated_at
      FROM admin_menu_label
      WHERE deleted_at IS NULL
      ORDER BY sort_order ASC, id ASC
    `
  );

  return result.rows;
}

export async function getAdminMenuTabs(): Promise<AdminMenuTabListItem[]> {
  const result = await pool.query<AdminMenuTabListItem>(
    `
      SELECT
        t.id,
        t.menu_label_id,
        l.code AS menu_label_code,
        l.name AS menu_label_name,
        t.code,
        t.name,
        t.is_active,
        t.sort_order,
        t.created_at,
        t.updated_at
      FROM admin_menu_tab t
      INNER JOIN admin_menu_label l
        ON l.id = t.menu_label_id
       AND l.deleted_at IS NULL
      WHERE t.deleted_at IS NULL
      ORDER BY l.sort_order ASC, t.sort_order ASC, t.id ASC
    `
  );

  return result.rows;
}

export async function getAdminMenuAll(): Promise<AdminMenuResponse> {
  const [labels, tabs] = await Promise.all([getAdminMenuLabels(), getAdminMenuTabs()]);
  return { labels, tabs };
}

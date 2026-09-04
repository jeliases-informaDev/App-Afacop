import { Platform } from "react-native";
import * as BackgroundTask from "expo-background-task";
import * as FileSystem from "expo-file-system/legacy";
import * as SecureStore from "expo-secure-store";
import * as SQLite from "expo-sqlite";
import * as TaskManager from "expo-task-manager";
import { API_URL } from "./api";

export const OFFLINE_SYNC_TASK = "radar360-offline-visit-sync";
const TOKEN_KEY = "radar_token";
const ADVISOR_KEY = "radar_advisor_id";
const DATABASE_NAME = "radar360-offline.db";
const REQUEST_TIMEOUT_MS = 25_000;

export type QueuedVisitInput = {
  id: string;
  advisorId: number;
  routeId: number;
  clientId: number;
  result: string;
  observations: string;
  amount: string | null;
  photo1Uri: string;
  photo2Uri: string;
  signature: string;
  latitude: number;
  longitude: number;
};

type PendingVisit = {
  id: string;
  advisor_id: number;
  route_id: number;
  client_id: number;
  result: string;
  observations: string;
  amount: string | null;
  photo1_uri: string;
  photo2_uri: string;
  signature: string;
  latitude: number;
  longitude: number;
  photo1_key: string | null;
  photo2_key: string | null;
  attempts: number;
};

export type SyncResult = {
  attempted: number;
  synced: number;
  pending: number;
  syncedIds: string[];
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;
let activeSync: Promise<SyncResult> | null = null;

async function database() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
        CREATE TABLE IF NOT EXISTS pending_visits (
          id TEXT PRIMARY KEY NOT NULL,
          advisor_id INTEGER NOT NULL,
          route_id INTEGER NOT NULL,
          client_id INTEGER NOT NULL,
          result TEXT NOT NULL,
          observations TEXT NOT NULL,
          amount TEXT,
          photo1_uri TEXT NOT NULL,
          photo2_uri TEXT NOT NULL,
          signature TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          photo1_key TEXT,
          photo2_key TEXT,
          attempts INTEGER NOT NULL DEFAULT 0,
          last_error TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS pending_visits_created_idx
          ON pending_visits(created_at);
        CREATE TABLE IF NOT EXISTS offline_cache (
          cache_key TEXT PRIMARY KEY NOT NULL,
          cache_value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
      const columns = await db.getAllAsync<{ name: string }>(
        "PRAGMA table_info(pending_visits)",
      );
      if (!columns.some((column) => column.name === "advisor_id")) {
        await db.execAsync(
          "ALTER TABLE pending_visits ADD COLUMN advisor_id INTEGER NOT NULL DEFAULT 0",
        );
      }
      return db;
    });
  }
  return databasePromise;
}

async function requestJson(path: string, options: RequestInit, token: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-client-platform": "mobile",
        "x-sede-id": "11111111-1111-1111-1111-000000000001",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const type = response.headers.get("content-type") || "";
    const body = type.includes("application/json")
      ? await response.json()
      : await response.text();
    if (!response.ok) {
      const error = new Error(
        (body as any)?.error ||
          (body as any)?.mensaje ||
          `Error de sincronización HTTP ${response.status}`,
      ) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }
    return body as any;
  } finally {
    clearTimeout(timeout);
  }
}

async function evidenceKey(
  item: PendingVisit,
  evidenceNumber: 1 | 2,
  token: string,
) {
  const uri = evidenceNumber === 1 ? item.photo1_uri : item.photo2_uri;
  const info = await FileSystem.getInfoAsync(uri);
  const size = info.exists && "size" in info ? Number(info.size || 0) : 0;
  if (!info.exists || !size) {
    throw new Error(`No se encontró la fotografía ${evidenceNumber} almacenada.`);
  }
  const signed = await requestJson(
    "/api/campo/evidencias/presign",
    {
      method: "POST",
      body: JSON.stringify({
        id_cliente: item.client_id,
        id_ruta: item.route_id,
        evidencia: evidenceNumber,
        tipo: "foto",
        content_type: "image/jpeg",
        size,
      }),
    },
    token,
  );
  const upload = await FileSystem.uploadAsync(signed.data.uploadUrl, uri, {
    httpMethod: "PUT",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { "Content-Type": signed.data.contentType },
  });
  if (upload.status < 200 || upload.status >= 300) {
    throw new Error(
      `No se pudo subir la fotografía ${evidenceNumber} (HTTP ${upload.status}).`,
    );
  }
  return String(signed.data.key);
}

async function synchronize(tokenOverride?: string | null): Promise<SyncResult> {
  const db = await database();
  const token =
    tokenOverride ||
    (Platform.OS === "web"
      ? globalThis.localStorage?.getItem(TOKEN_KEY)
      : await SecureStore.getItemAsync(TOKEN_KEY));
  const advisorIdValue =
    Platform.OS === "web"
      ? globalThis.localStorage?.getItem(ADVISOR_KEY)
      : await SecureStore.getItemAsync(ADVISOR_KEY);
  const advisorId = Number(advisorIdValue);
  if (!token || !advisorId) {
    const row = await db.getFirstAsync<{ total: number }>(
      "SELECT COUNT(*) AS total FROM pending_visits",
    );
    return {
      attempted: 0,
      synced: 0,
      pending: Number(row?.total || 0),
      syncedIds: [],
    };
  }
  const items = await db.getAllAsync<PendingVisit>(
    "SELECT * FROM pending_visits WHERE advisor_id = ? ORDER BY created_at ASC",
    advisorId,
  );
  const result: SyncResult = {
    attempted: 0,
    synced: 0,
    pending: items.length,
    syncedIds: [],
  };
  if (!items.length) return result;

  for (const item of items) {
    result.attempted += 1;
    try {
      let photo1Key = item.photo1_key;
      let photo2Key = item.photo2_key;
      if (!photo1Key) {
        photo1Key = await evidenceKey(item, 1, token);
        await db.runAsync(
          "UPDATE pending_visits SET photo1_key = ?, updated_at = ? WHERE id = ?",
          photo1Key,
          Date.now(),
          item.id,
        );
      }
      if (!photo2Key) {
        photo2Key = await evidenceKey(item, 2, token);
        await db.runAsync(
          "UPDATE pending_visits SET photo2_key = ?, updated_at = ? WHERE id = ?",
          photo2Key,
          Date.now(),
          item.id,
        );
      }
      await requestJson(
        "/api/campo/visitas",
        {
          method: "POST",
          body: JSON.stringify({
            client_sync_id: item.id,
            id_ruta: item.route_id,
            id_cliente: item.client_id,
            resultado: item.result,
            observaciones: item.observations,
            monto_recaudado: item.amount,
            foto_evidencia_key: photo1Key,
            foto_adicional_evidencia_key: photo2Key,
            firma_evidencia: item.signature,
            latitud: item.latitude,
            longitud: item.longitude,
          }),
        },
        token,
      );
      await db.runAsync("DELETE FROM pending_visits WHERE id = ?", item.id);
      await Promise.all([
        FileSystem.deleteAsync(item.photo1_uri, { idempotent: true }).catch(() => {}),
        FileSystem.deleteAsync(item.photo2_uri, { idempotent: true }).catch(() => {}),
      ]);
      result.synced += 1;
      result.pending -= 1;
      result.syncedIds.push(item.id);
    } catch (error: any) {
      await db.runAsync(
        "UPDATE pending_visits SET attempts = attempts + 1, last_error = ?, updated_at = ? WHERE id = ?",
        String(error?.message || "Error de sincronización").slice(0, 500),
        Date.now(),
        item.id,
      );
      if (error?.status === 401 || error?.status === 403) break;
      // Se conserva el orden: una gestión posterior no debe adelantarse a otra.
      break;
    }
  }
  return result;
}

export function createOfflineVisitId(routeId: number, clientId: number) {
  const random = Math.random().toString(36).slice(2, 12);
  return `mobile-${routeId}-${clientId}-${Date.now().toString(36)}-${random}`;
}

export async function enqueueVisit(input: QueuedVisitInput) {
  const db = await database();
  const now = Date.now();
  await db.runAsync(
    `INSERT OR IGNORE INTO pending_visits (
      id, advisor_id, route_id, client_id, result, observations, amount,
      photo1_uri, photo2_uri, signature, latitude, longitude,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    input.id,
    input.advisorId,
    input.routeId,
    input.clientId,
    input.result,
    input.observations,
    input.amount,
    input.photo1Uri,
    input.photo2Uri,
    input.signature,
    input.latitude,
    input.longitude,
    now,
    now,
  );
  // La gestión ya quedó guardada. Una restricción del fabricante para tareas
  // en segundo plano nunca debe convertir el guardado local en un error.
  await registerOfflineSyncTask().catch(() => false);
  return input.id;
}

export async function syncPendingVisits(token?: string | null) {
  if (!activeSync) {
    activeSync = synchronize(token).finally(() => {
      activeSync = null;
    });
  }
  return activeSync;
}

export async function pendingVisitCount() {
  const db = await database();
  const advisorIdValue =
    Platform.OS === "web"
      ? globalThis.localStorage?.getItem(ADVISOR_KEY)
      : await SecureStore.getItemAsync(ADVISOR_KEY);
  const advisorId = Number(advisorIdValue);
  const row = advisorId
    ? await db.getFirstAsync<{ total: number }>(
        "SELECT COUNT(*) AS total FROM pending_visits WHERE advisor_id = ?",
        advisorId,
      )
    : null;
  return Number(row?.total || 0);
}

function limaDay() {
  return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function cacheTodayRoute(route: unknown, advisorId?: number | null) {
  const db = await database();
  const cacheKey = `today_route_${Number(advisorId || 0)}_${limaDay()}`;
  await db.runAsync(
    `INSERT INTO offline_cache(cache_key, cache_value, updated_at)
     VALUES(?, ?, ?)
     ON CONFLICT(cache_key) DO UPDATE SET
       cache_value = excluded.cache_value,
       updated_at = excluded.updated_at`,
    cacheKey,
    JSON.stringify(route),
    Date.now(),
  );
}

export async function getCachedTodayRoute<T = any>(advisorId?: number | null): Promise<T | null> {
  const db = await database();
  const cacheKey = `today_route_${Number(advisorId || 0)}_${limaDay()}`;
  const row = await db.getFirstAsync<{ cache_value: string }>(
    "SELECT cache_value FROM offline_cache WHERE cache_key = ?",
    cacheKey,
  );
  if (!row?.cache_value) return null;
  try {
    return JSON.parse(row.cache_value) as T;
  } catch {
    return null;
  }
}

export async function registerOfflineSyncTask() {
  if (Platform.OS === "web") return false;
  const status = await BackgroundTask.getStatusAsync();
  if (status !== BackgroundTask.BackgroundTaskStatus.Available) return false;
  const registered = await TaskManager.isTaskRegisteredAsync(OFFLINE_SYNC_TASK);
  if (!registered) {
    await BackgroundTask.registerTaskAsync(OFFLINE_SYNC_TASK, {
      minimumInterval: 15,
    });
  }
  return true;
}

if (!TaskManager.isTaskDefined(OFFLINE_SYNC_TASK)) {
  TaskManager.defineTask(OFFLINE_SYNC_TASK, async () => {
    try {
      await syncPendingVisits();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch {
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

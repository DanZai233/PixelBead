import type { SavedProject } from './projectStorage';

const CACHE_DB_NAME = 'pixelbead_cache';
const CACHE_DB_VERSION = 1;
const THUMBNAIL_STORE = 'project_thumbnails';

function openCacheDatabase(): Promise<IDBDatabase | null> {
  return new Promise(resolve => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }

    try {
      const request = indexedDB.open(CACHE_DB_NAME, CACHE_DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(THUMBNAIL_STORE)) {
          database.createObjectStore(THUMBNAIL_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function withThumbnailStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  return openCacheDatabase().then(database => new Promise<T | null>(resolve => {
    if (!database) {
      resolve(null);
      return;
    }

    try {
      const transaction = database.transaction(THUMBNAIL_STORE, mode);
      const request = action(transaction.objectStore(THUMBNAIL_STORE));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      transaction.oncomplete = () => database.close();
      transaction.onabort = () => {
        database.close();
        resolve(null);
      };
    } catch {
      database.close();
      resolve(null);
    }
  }));
}

export function getProjectThumbnail(projectId: string, updatedAt: number): Promise<string | null> {
  return withThumbnailStore(
    'readonly',
    store => store.get(`${projectId}:${updatedAt}`) as IDBRequest<string | undefined>,
  ).then(value => value || null);
}

export function saveProjectThumbnail(
  projectId: string,
  updatedAt: number,
  thumbnail: string,
): Promise<void> {
  return withThumbnailStore(
    'readwrite',
    store => store.put(thumbnail, `${projectId}:${updatedAt}`) as IDBRequest<IDBValidKey>,
  ).then(() => undefined);
}

export async function createProjectThumbnail(
  project: Pick<SavedProject, 'grid' | 'gridWidth' | 'gridHeight'>,
  maxSize = 160,
): Promise<string | null> {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return null;

  const scale = Math.min(1, maxSize / Math.max(project.gridWidth, project.gridHeight));
  canvas.width = Math.max(1, Math.round(project.gridWidth * scale));
  canvas.height = Math.max(1, Math.round(project.gridHeight * scale));
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  project.grid.forEach((row, rowIndex) => {
    row.forEach((color, colIndex) => {
      if (color === '#FFFFFF') return;
      context.fillStyle = color;
      context.fillRect(
        colIndex * scale,
        rowIndex * scale,
        Math.max(1, scale),
        Math.max(1, scale),
      );
    });
  });

  return canvas.toDataURL('image/webp', 0.82);
}

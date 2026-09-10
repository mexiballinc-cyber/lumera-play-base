// Módulo de persistencia local mediante IndexedDB para Lumera

const DB_NAME = 'LumeraDB';
const DB_VERSION = 1;

export const db = {
  dbPromise: null,

  init() {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const database = event.target.result;

        if (!database.objectStoreNames.contains('users')) {
          database.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        }
        if (!database.objectStoreNames.contains('profiles')) {
          database.createObjectStore('profiles', { keyPath: 'id', autoIncrement: true });
        }
        if (!database.objectStoreNames.contains('watchHistory')) {
          database.createObjectStore('watchHistory', { keyPath: 'id', autoIncrement: true });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject('Error al abrir la base de datos: ' + event.target.error);
      };
    });

    return this.dbPromise;
  },

  async getStore(storeName, mode = 'readonly') {
    const database = await this.init();
    const tx = database.transaction(storeName, mode);
    return tx.objectStore(storeName);
  },

  async getAll(storeName) {
    const store = await this.getStore(storeName, 'readonly');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async add(storeName, item) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.add(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async put(storeName, item) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName, key) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
};

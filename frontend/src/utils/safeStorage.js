/**
 * A safe wrapper around localStorage to gracefully handle SecurityError.
 * When localStorage is blocked (e.g., third-party cookies disabled in iframe),
 * this falls back to an in-memory Map to prevent application crashes.
 */

class SafeStorage {
    constructor() {
        this.memoryStore = new Map();
        this.isSupported = this._checkSupport();
    }

    _checkSupport() {
        try {
            const testKey = '__test_support__';
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.warn('localStorage is not available, falling back to in-memory storage. Error:', error);
            return false;
        }
    }

    getItem(key) {
        if (this.isSupported) {
            try {
                return window.localStorage.getItem(key);
            } catch (error) {
                console.warn(`Failed to get item '${key}' from localStorage:`, error);
            }
        }
        return this.memoryStore.get(key) || null;
    }

    setItem(key, value) {
        if (this.isSupported) {
            try {
                window.localStorage.setItem(key, value);
                return;
            } catch (error) {
                console.warn(`Failed to set item '${key}' in localStorage:`, error);
            }
        }
        this.memoryStore.set(key, String(value));
    }

    removeItem(key) {
        if (this.isSupported) {
            try {
                window.localStorage.removeItem(key);
                return;
            } catch (error) {
                console.warn(`Failed to remove item '${key}' from localStorage:`, error);
            }
        }
        this.memoryStore.delete(key);
    }

    clear() {
        if (this.isSupported) {
            try {
                window.localStorage.clear();
                return;
            } catch (error) {
                console.warn('Failed to clear localStorage:', error);
            }
        }
        this.memoryStore.clear();
    }
}

export const safeStorage = new SafeStorage();

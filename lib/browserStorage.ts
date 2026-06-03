const memoryStorage = new Map<string, string>();

const getWebStorage = (kind: "localStorage" | "sessionStorage") => {
	if (typeof window === "undefined") return null;
	try {
		return window[kind];
	} catch {
		return null;
	}
};

const safeGet = (storage: Storage | null, key: string) => {
	if (!storage) return null;
	try {
		return storage.getItem(key);
	} catch {
		return null;
	}
};

const safeSet = (storage: Storage | null, key: string, value: string) => {
	if (!storage) return false;
	try {
		storage.setItem(key, value);
		return true;
	} catch {
		return false;
	}
};

export const hasPersistentBrowserStorage = () => {
	if (typeof window === "undefined") return false;
	return Boolean(getWebStorage("localStorage") || getWebStorage("sessionStorage"));
};

export const getStoredValue = (key: string) => {
	if (typeof window === "undefined") return "";

	const localValue = safeGet(getWebStorage("localStorage"), key);
	if (localValue !== null) return localValue;

	const sessionValue = safeGet(getWebStorage("sessionStorage"), key);
	if (sessionValue !== null) return sessionValue;

	return memoryStorage.get(key) || "";
};

export const setStoredValue = (key: string, value: string) => {
	if (typeof window === "undefined") return;

	if (safeSet(getWebStorage("localStorage"), key, value)) {
		memoryStorage.delete(key);
		return;
	}

	if (safeSet(getWebStorage("sessionStorage"), key, value)) {
		memoryStorage.delete(key);
		return;
	}

	memoryStorage.set(key, value);
};
import Storage from "expo-sqlite/kv-store";
import { createPendingGotStore } from "./pending-got";

/** App-wide pending-got note, kept in expo-sqlite's key-value store. */
export const pendingGotStore = createPendingGotStore(Storage);

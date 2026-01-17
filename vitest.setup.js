/**
 * Vitest Setup File
 *
 * This file runs before all tests to set up the test environment.
 * It configures fake-indexeddb so Dexie can use it in tests.
 */

import Dexie from 'dexie'
import indexedDB from 'fake-indexeddb'
import IDBKeyRange from 'fake-indexeddb/lib/FDBKeyRange'

// Set up fake-indexeddb for Dexie BEFORE any modules are imported
// This allows database tests to work without needing real browser IndexedDB
Dexie.dependencies.indexedDB = indexedDB
Dexie.dependencies.IDBKeyRange = IDBKeyRange

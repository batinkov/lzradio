import { describe, it, expect, beforeEach } from 'vitest'
import indexedDB from 'fake-indexeddb'
import {
  addContact,
  getContact,
  getAllContacts,
  searchByCallsign,
  updateContact,
  deleteContact,
  getContactCount
} from './logbookDB.js'

describe('logbookDB', () => {
  // Clear database data before each test
  beforeEach(async () => {
    try {
      const dbName = 'LZRadioDB'
      const request = indexedDB.open(dbName)

      await new Promise((resolve, reject) => {
        request.onsuccess = async () => {
          const db = request.result
          const objectStoreNames = Array.from(db.objectStoreNames)

          if (objectStoreNames.length > 0) {
            const transaction = db.transaction(objectStoreNames, 'readwrite')
            for (const storeName of objectStoreNames) {
              transaction.objectStore(storeName).clear()
            }
            transaction.oncomplete = () => {
              db.close()
              resolve()
            }
            transaction.onerror = () => {
              db.close()
              reject(transaction.error)
            }
          } else {
            db.close()
            resolve()
          }
        }
        request.onerror = () => reject(request.error)
      })
    } catch {
      // If database doesn't exist yet, that's fine
    }
  })

  describe('addContact', () => {
    it('should add a contact and return its ID', async () => {
      const contactData = {
        baseCallsign: 'W1ABC',
        prefix: null,
        suffix: 'M',
        date: '2025-01-29',
        time: '14:23:00',
        frequency: 14.250,
        mode: 'SSB',
        power: 100,
        rstSent: '59',
        rstReceived: '59',
        qslReceived: false,
        qslSent: false,
        remarks: 'Test contact'
      }

      const id = await addContact(contactData)
      expect(id).toBe(1)
    })

    it('should add createdAt and updatedAt timestamps', async () => {
      const contactData = {
        baseCallsign: 'W1ABC',
        date: '2025-01-29',
        time: '14:23:00',
        frequency: 14.250,
        mode: 'SSB'
      }

      const beforeAdd = Date.now()
      const id = await addContact(contactData)
      const afterAdd = Date.now()

      const contact = await getContact(id)
      expect(contact.createdAt).toBeGreaterThanOrEqual(beforeAdd)
      expect(contact.createdAt).toBeLessThanOrEqual(afterAdd)
      expect(contact.updatedAt).toBe(contact.createdAt)
    })

    it('should auto-increment IDs for multiple contacts', async () => {
      const contact1 = { baseCallsign: 'W1ABC', date: '2025-01-29', time: '14:00:00', frequency: 14.0, mode: 'SSB' }
      const contact2 = { baseCallsign: 'K2XYZ', date: '2025-01-29', time: '15:00:00', frequency: 7.0, mode: 'CW' }

      const id1 = await addContact(contact1)
      const id2 = await addContact(contact2)

      expect(id1).toBeTypeOf('number')
      expect(id2).toBeTypeOf('number')
      expect(id2).toBeGreaterThan(id1) // Second ID should be greater than first
    })
  })

  describe('getContact', () => {
    it('should retrieve a contact by ID', async () => {
      const contactData = {
        baseCallsign: 'W1ABC',
        prefix: 'HB',
        suffix: 'P',
        date: '2025-01-29',
        time: '14:23:00',
        frequency: 14.250,
        mode: 'SSB',
        power: 100,
        rstSent: '59',
        rstReceived: '59',
        qslReceived: false,
        qslSent: false,
        remarks: 'Test'
      }

      const id = await addContact(contactData)
      const retrieved = await getContact(id)

      expect(retrieved).toMatchObject(contactData)
      expect(retrieved.id).toBe(id)
      expect(retrieved.createdAt).toBeDefined()
      expect(retrieved.updatedAt).toBeDefined()
    })

    it('should return undefined for non-existent ID', async () => {
      const result = await getContact(999)
      expect(result).toBeUndefined()
    })
  })

  describe('getAllContacts', () => {
    it('should return empty array when no contacts exist', async () => {
      const contacts = await getAllContacts()
      expect(contacts).toEqual([])
    })

    it('should return all contacts sorted by date (newest first)', async () => {
      await addContact({ baseCallsign: 'W1ABC', date: '2025-01-15', time: '10:00:00', frequency: 14.0, mode: 'SSB' })
      await addContact({ baseCallsign: 'K2XYZ', date: '2025-01-29', time: '11:00:00', frequency: 7.0, mode: 'CW' })
      await addContact({ baseCallsign: 'DL1DEF', date: '2025-01-20', time: '12:00:00', frequency: 21.0, mode: 'FT8' })

      const contacts = await getAllContacts()

      expect(contacts).toHaveLength(3)
      expect(contacts[0].date).toBe('2025-01-29') // Newest
      expect(contacts[1].date).toBe('2025-01-20')
      expect(contacts[2].date).toBe('2025-01-15') // Oldest
    })
  })

  describe('searchByCallsign', () => {
    beforeEach(async () => {
      // Add test data
      await addContact({ baseCallsign: 'W1ABC', date: '2025-01-15', time: '10:00:00', frequency: 14.0, mode: 'SSB' })
      await addContact({ baseCallsign: 'W1ABC', date: '2025-01-20', time: '11:00:00', frequency: 7.0, mode: 'CW' })
      await addContact({ baseCallsign: 'K2XYZ', date: '2025-01-20', time: '12:00:00', frequency: 21.0, mode: 'FT8' })
    })

    it('should find all contacts with matching base callsign', async () => {
      const matches = await searchByCallsign('W1ABC')
      expect(matches).toHaveLength(2)
      expect(matches.every(c => c.baseCallsign === 'W1ABC')).toBe(true)
    })

    it('should be case-insensitive', async () => {
      const matches = await searchByCallsign('w1abc')
      expect(matches).toHaveLength(2)
    })

    it('should return empty array for non-existent callsign', async () => {
      const matches = await searchByCallsign('NONEXISTENT')
      expect(matches).toEqual([])
    })
  })

  describe('updateContact', () => {
    it('should update contact fields and updatedAt timestamp', async () => {
      const id = await addContact({
        baseCallsign: 'W1ABC',
        date: '2025-01-29',
        time: '14:00:00',
        frequency: 14.0,
        mode: 'SSB',
        qslReceived: false
      })

      const originalContact = await getContact(id)
      const originalUpdatedAt = originalContact.updatedAt

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10))

      await updateContact(id, { qslReceived: true, remarks: 'QSL confirmed' })

      const updated = await getContact(id)
      expect(updated.qslReceived).toBe(true)
      expect(updated.remarks).toBe('QSL confirmed')
      expect(updated.updatedAt).toBeGreaterThan(originalUpdatedAt)
      expect(updated.createdAt).toBe(originalContact.createdAt) // Should not change
    })

    it('should return 1 when contact is updated', async () => {
      const id = await addContact({ baseCallsign: 'W1ABC', date: '2025-01-29', time: '14:00:00', frequency: 14.0, mode: 'SSB' })
      const result = await updateContact(id, { mode: 'CW' })
      expect(result).toBe(1)
    })

    it('should return 0 when contact does not exist', async () => {
      const result = await updateContact(999, { mode: 'CW' })
      expect(result).toBe(0)
    })
  })

  describe('deleteContact', () => {
    it('should delete an existing contact', async () => {
      const id = await addContact({ baseCallsign: 'W1ABC', date: '2025-01-29', time: '14:00:00', frequency: 14.0, mode: 'SSB' })

      await deleteContact(id)

      const contact = await getContact(id)
      expect(contact).toBeUndefined()
    })

    it('should not throw error when deleting non-existent contact', async () => {
      await expect(deleteContact(999)).resolves.not.toThrow()
    })
  })

  describe('getContactCount', () => {
    it('should return 0 when no contacts exist', async () => {
      const count = await getContactCount()
      expect(count).toBe(0)
    })

    it('should return correct count of contacts', async () => {
      await addContact({ baseCallsign: 'W1ABC', date: '2025-01-29', time: '14:00:00', frequency: 14.0, mode: 'SSB' })
      await addContact({ baseCallsign: 'K2XYZ', date: '2025-01-29', time: '15:00:00', frequency: 7.0, mode: 'CW' })
      await addContact({ baseCallsign: 'DL1DEF', date: '2025-01-29', time: '16:00:00', frequency: 21.0, mode: 'FT8' })

      const count = await getContactCount()
      expect(count).toBe(3)
    })

    it('should decrement count after deletion', async () => {
      const id1 = await addContact({ baseCallsign: 'W1ABC', date: '2025-01-29', time: '14:00:00', frequency: 14.0, mode: 'SSB' })
      await addContact({ baseCallsign: 'K2XYZ', date: '2025-01-29', time: '15:00:00', frequency: 7.0, mode: 'CW' })

      expect(await getContactCount()).toBe(2)

      await deleteContact(id1)

      expect(await getContactCount()).toBe(1)
    })
  })
})

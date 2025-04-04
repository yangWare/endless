/**
 * IndexedDB工具类
 */
class DB {
  constructor(dbName, version = 2) {
    this.dbName = dbName
    this.version = version
    this.db = null
  }

  /**
   * 连接数据库
   * @returns {Promise<IDBDatabase>}
   */
  async connect() {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        const oldVersion = event.oldVersion
        const newVersion = event.newVersion

        // 清理旧版本数据
        if (oldVersion < newVersion) {
          // 删除旧的对象存储
          if (db.objectStoreNames.contains('state')) {
            db.deleteObjectStore('state')
          }
        }

        // 创建新的对象存储
        if (!db.objectStoreNames.contains('state')) {
          db.createObjectStore('state', { keyPath: 'id' })
        }
      }
    })
  }

  /**
   * 保存状态
   * @param {Object} state 状态对象
   * @returns {Promise<void>}
   */
  async saveState(state) {
    await this.connect()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['state'], 'readwrite')
      const store = transaction.objectStore('state')

      const request = store.put({ id: 'gameState', ...state })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  /**
   * 获取状态
   * @returns {Promise<Object>}
   */
  async getState() {
    await this.connect()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['state'], 'readonly')
      const store = transaction.objectStore('state')

      const request = store.get('gameState')

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result : null)
      }
    })
  }
}

export const db = new DB('endless_game', 3)

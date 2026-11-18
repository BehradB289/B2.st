/**
 * مخزن مدیریت وضعیت ذخیره‌سازی بازی ماریو (Save Slots Repository)
 * @module src/db/repositories/save_repository
 */

import { DATABASE_CONFIG } from '../../../config/database_config.js';
import { DatabaseLayer } from '../database_layer.js';

export class SaveRepository {
  constructor(dbLayer = new DatabaseLayer()) {
    this.db = dbLayer;
  }

  /**
   * ایجاد کلید یکتا برای هر اسلات ذخیره
   */
  _buildSaveKey(profileId, slotIndex) {
    return `save_${profileId}_slot_${slotIndex}`;
  }

  /**
   * ذخیره پیشرفت بازیکن در یک اسلات مشخص
   * @param {Object} params
   * @param {string} params.profileId
   * @param {number} params.slotIndex
   * @param {number} params.world
   * @param {number} params.level
   * @param {number} params.score
   * @param {number} params.coins
   * @param {number} params.lives
   * @param {string} params.marioState
   * @param {number} params.checkpointX
   * @param {number} params.checkpointY
   * @param {number} [params.playtime=0]
   * @returns {Promise<Object>}
   */
  async saveGameState({
    profileId,
    slotIndex,
    world = 1,
    level = 1,
    score = 0,
    coins = 0,
    lives = 3,
    marioState = 'small',
    checkpointX = 40,
    checkpointY = 180,
    playtime = 0
  }) {
    const id = this._buildSaveKey(profileId, slotIndex);
    const existing = await this.db.get(DATABASE_CONFIG.STORES.SAVES, id, false);
    const currentPlaytime = (existing?.playtime || 0) + playtime;

    const saveRecord = {
      id,
      profileId,
      slotIndex,
      world,
      level,
      score,
      coins,
      lives,
      marioState,
      checkpointX,
      checkpointY,
      playtime: currentPlaytime,
      updatedAt: Date.now()
    };

    return this.db.put(DATABASE_CONFIG.STORES.SAVES, saveRecord, true);
  }

  /**
   * بارگذاری وضعیت بازی یک اسلات
   * @param {string} profileId 
   * @param {number} slotIndex 
   * @returns {Promise<Object|null>}
   */
  async loadGameState(profileId, slotIndex) {
    const id = this._buildSaveKey(profileId, slotIndex);
    return this.db.get(DATABASE_CONFIG.STORES.SAVES, id, true);
  }

  /**
   * دریافت فهرست تمام اسلات‌های متعلق به یک کاربر
   * @param {string} profileId 
   * @returns {Promise<Array>}
   */
  async getProfileSaveSlots(profileId) {
    const keyRange = IDBKeyRange.only(profileId);
    return this.db.queryIndex(DATABASE_CONFIG.STORES.SAVES, 'profileId_idx', keyRange, 'next');
  }

  /**
   * حذف فیزیکی یک اسلات ذخیره
   * @param {string} profileId 
   * @param {number} slotIndex 
   * @returns {Promise<boolean>}
   */
  async deleteSlot(profileId, slotIndex) {
    const id = this._buildSaveKey(profileId, slotIndex);
    return this.db.delete(DATABASE_CONFIG.STORES.SAVES, id);
  }
}
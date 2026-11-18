/**
 * مخزن مدیریت پروفایل‌ها و لیدربورد بازی ماریو (Profile & Leaderboard Repository)
 * @module src/db/repositories/profile_repository
 */

import { DATABASE_CONFIG } from '../../../config/database_config.js';
import { DatabaseLayer } from '../database_layer.js';

export class ProfileRepository {
  constructor(dbLayer = new DatabaseLayer()) {
    this.db = dbLayer;
  }

  /**
   * ایجاد پروفایل بازیکن جدید
   * @param {string} username 
   * @returns {Promise<Object>}
   */
  async createProfile(username) {
    const cleanUsername = username.trim();
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // اطمینان از یکتا بودن نام کاربری
    const existing = await this.db.queryIndex(
      DATABASE_CONFIG.STORES.PROFILES,
      'username_idx',
      IDBKeyRange.only(cleanUsername)
    );

    if (existing.length > 0) {
      throw new Error(`Profile with username '${cleanUsername}' already exists.`);
    }

    const profile = {
      id,
      username: cleanUsername,
      createdAt: Date.now()
    };

    return this.db.put(DATABASE_CONFIG.STORES.PROFILES, profile, false);
  }

  /**
   * دریافت پروفایل بازیکن
   * @param {string} id 
   * @returns {Promise<Object|null>}
   */
  async getProfile(id) {
    return this.db.get(DATABASE_CONFIG.STORES.PROFILES, id, false);
  }

  /**
   * ثبت امتیاز بالا در جدول رکوردها
   * @param {Object} params
   * @param {string} params.profileId
   * @param {string} params.playerName
   * @param {number} params.score
   * @param {number} params.world
   * @param {number} params.level
   * @returns {Promise<Object>}
   */
  async recordHighScore({ profileId, playerName, score, world, level }) {
    const record = {
      id: `score_${profileId}_${Date.now()}`,
      profileId,
      playerName,
      score,
      worldLevel: `${world}-${level}`,
      timestamp: Date.now()
    };

    return this.db.put(DATABASE_CONFIG.STORES.LEADERBOARD, record, true);
  }

  /**
   * واکشی برترین امتیازات به صورت نزولی
   * @param {number} [limit=10] 
   * @returns {Promise<Array>}
   */
  async getTopScores(limit = 10) {
    const records = await this.db.queryIndex(
      DATABASE_CONFIG.STORES.LEADERBOARD,
      'score_idx',
      null,
      'prev',
      limit
    );
    return records;
  }
}
process.env.NODE_ENV = 'test';
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const cleanupService = require('./cleanup.service');
const youtubeService = require('../modules/youtube/youtube.service');
const audioService = require('../modules/audio/audio.service');

describe('Auto-Cleanup Service & Cron Tests (core/cleanup.service.js)', () => {
  const tempDir = path.join(__dirname, '../temp');

  beforeEach(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    cleanupService.stopCleanupCron();
  });

  test('1. cleanTempFolder: Menghapus file yang berusia > 30 menit dan mempertahankan file baru serta .gitkeep', async () => {
    const now = Date.now();

    // Buat file lama (usia 45 menit yang lalu)
    const oldFilePath = path.join(tempDir, `test-old-${now}.tmp`);
    fs.writeFileSync(oldFilePath, 'sample old data');
    const oldTime = new Date(now - 45 * 60 * 1000);
    fs.utimesSync(oldFilePath, oldTime, oldTime);

    // Buat file baru (usia 5 menit yang lalu)
    const freshFilePath = path.join(tempDir, `test-fresh-${now}.tmp`);
    fs.writeFileSync(freshFilePath, 'sample fresh data');
    const freshTime = new Date(now - 5 * 60 * 1000);
    fs.utimesSync(freshFilePath, freshTime, freshTime);

    // Pastikan .gitkeep ada
    const gitkeepPath = path.join(tempDir, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
      fs.writeFileSync(gitkeepPath, '');
    }

    // Jalankan cleanTempFolder dengan ambang batas 30 menit
    const result = await cleanupService.cleanTempFolder(tempDir, 30);

    assert.ok(result.deletedFiles >= 1, 'Harus menghapus minimal 1 file');
    assert.strictEqual(fs.existsSync(oldFilePath), false, 'File lama harus sudah terhapus');
    assert.strictEqual(fs.existsSync(freshFilePath), true, 'File baru harus tetap ada');
    assert.strictEqual(fs.existsSync(gitkeepPath), true, 'File .gitkeep tidak boleh terhapus');

    // Cleanup sisa file baru
    if (fs.existsSync(freshFilePath)) {
      fs.unlinkSync(freshFilePath);
    }
  });

  test('2. YouTube taskStore: Membersihkan task in-memory yang sudah berusia > 30 menit', async () => {
    const oldTaskId = 'yt-old-task-123';
    const freshTaskId = 'yt-fresh-task-456';
    const now = Date.now();

    youtubeService.taskStore.set(oldTaskId, {
      taskId: oldTaskId,
      status: 'completed',
      createdAt: new Date(now - 40 * 60 * 1000), // 40 menit lalu
    });

    youtubeService.taskStore.set(freshTaskId, {
      taskId: freshTaskId,
      status: 'processing',
      createdAt: new Date(now - 5 * 60 * 1000), // 5 menit lalu
    });

    const cleaned = youtubeService.cleanupStaleTasks(30);

    assert.strictEqual(cleaned, 1);
    assert.strictEqual(youtubeService.taskStore.has(oldTaskId), false, 'Task lama harus terhapus dari memory');
    assert.strictEqual(youtubeService.taskStore.has(freshTaskId), true, 'Task baru harus tetap ada di memory');

    youtubeService.taskStore.clear();
  });

  test('3. Audio taskStore: Membersihkan task in-memory yang sudah berusia > 30 menit', async () => {
    const oldTaskId = 'audio-old-task-123';
    const freshTaskId = 'audio-fresh-task-456';
    const now = Date.now();

    audioService.taskStore.set(oldTaskId, {
      taskId: oldTaskId,
      status: 'failed',
      createdAt: new Date(now - 50 * 60 * 1000), // 50 menit lalu
    });

    audioService.taskStore.set(freshTaskId, {
      taskId: freshTaskId,
      status: 'completed',
      createdAt: new Date(now - 10 * 60 * 1000), // 10 menit lalu
    });

    const cleaned = audioService.cleanupStaleTasks(30);

    assert.strictEqual(cleaned, 1);
    assert.strictEqual(audioService.taskStore.has(oldTaskId), false, 'Task audio lama harus terhapus dari memory');
    assert.strictEqual(audioService.taskStore.has(freshTaskId), true, 'Task audio baru harus tetap ada');

    audioService.taskStore.clear();
  });

  test('4. cleanAllStaleData: Menjalankan pembersihan gabungan folder temp & store memory', async () => {
    const summary = await cleanupService.cleanAllStaleData(30);

    assert.ok(typeof summary.deletedFiles === 'number');
    assert.ok(typeof summary.cleanedYtTasks === 'number');
    assert.ok(typeof summary.cleanedAudioTasks === 'number');
  });

  test('5. startCleanupCron & stopCleanupCron: Menginisialisasi dan menghentikan interval cron', () => {
    const timer = cleanupService.startCleanupCron(10000, 30);
    assert.ok(timer);
    cleanupService.stopCleanupCron();
  });
});

process.env.NODE_ENV = 'test';
const { test, describe } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const sharp = require('sharp');
const app = require('../../server');

// Helper untuk membuat buffer gambar valid
async function createSampleImage(width = 100, height = 100, format = 'png') {
  const image = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 50, g: 150, b: 250 },
    },
  });

  if (format === 'jpg' || format === 'jpeg') {
    return await image.jpeg().toBuffer();
  }
  if (format === 'webp') {
    return await image.webp().toBuffer();
  }
  if (format === 'avif') {
    return await image.avif().toBuffer();
  }
  if (format === 'gif') {
    return await image.gif().toBuffer();
  }
  return await image.png().toBuffer();
}

describe('Image Convert Feature Tests (POST /api/image/convert)', () => {
  test('1. Happy Path: Mengonversi format PNG ke WebP', async () => {
    const pngBuffer = await createSampleImage(200, 200, 'png');

    const res = await request(app)
      .post('/api/image/convert')
      .attach('file', pngBuffer, 'sample.png')
      .field('format', 'webp');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'image/webp');
    assert.match(res.headers['content-disposition'], /converted\.webp/);

    const metadata = await sharp(res.body).metadata();
    assert.strictEqual(metadata.format, 'webp');
    assert.strictEqual(metadata.width, 200);
    assert.strictEqual(metadata.height, 200);
  });

  test('2. Happy Path: Mengonversi format JPG ke AVIF', async () => {
    const jpgBuffer = await createSampleImage(150, 150, 'jpeg');

    const res = await request(app)
      .post('/api/image/convert')
      .attach('file', jpgBuffer, 'sample.jpg')
      .field('format', 'avif');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'image/avif');
    assert.match(res.headers['content-disposition'], /converted\.avif/);

    const metadata = await sharp(res.body).metadata();
    assert.ok(metadata.format === 'avif' || metadata.format === 'heif');
  });

  test('3. Happy Path: Mengonversi format PNG ke GIF', async () => {
    const pngBuffer = await createSampleImage(100, 100, 'png');

    const res = await request(app)
      .post('/api/image/convert')
      .attach('file', pngBuffer, 'sample.png')
      .field('format', 'gif');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'image/gif');
    assert.match(res.headers['content-disposition'], /converted\.gif/);

    const metadata = await sharp(res.body).metadata();
    assert.strictEqual(metadata.format, 'gif');
  });

  test('4. Happy Path: Mengonversi format PNG ke JPG / JPEG', async () => {
    const pngBuffer = await createSampleImage(120, 120, 'png');

    const res = await request(app)
      .post('/api/image/convert')
      .attach('file', pngBuffer, 'sample.png')
      .field('format', 'jpg');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'image/jpeg');
    assert.match(res.headers['content-disposition'], /converted\.jpg/);

    const metadata = await sharp(res.body).metadata();
    assert.strictEqual(metadata.format, 'jpeg');
  });

  test('5. Validasi Keberadaan File: Gagal jika file tidak dilampirkan', async () => {
    const res = await request(app)
      .post('/api/image/convert')
      .field('format', 'webp');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /File gambar wajib diunggah/i);
  });

  test('6. Validasi Ukuran File: Gagal jika ukuran file > 10 MB', async () => {
    // 11 MB dummy buffer
    const largeBuffer = Buffer.alloc(11 * 1024 * 1024, 0);

    const res = await request(app)
      .post('/api/image/convert')
      .attach('file', largeBuffer, 'large.png')
      .field('format', 'webp');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /melebihi batas maksimal/i);
  });

  test('7. Validasi Resolusi Gambar: Gagal jika resolusi > 8192x8192', async () => {
    const largeDimImage = await createSampleImage(8193, 10, 'png');

    const res = await request(app)
      .post('/api/image/convert')
      .attach('file', largeDimImage, 'huge_resolution.png')
      .field('format', 'webp');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /8192 x 8192/i);
  });

  test('8. Validasi Format Target Tidak Valid: Gagal jika format tidak didukung (misal bmp)', async () => {
    const sampleBuffer = await createSampleImage(50, 50, 'png');

    const res = await request(app)
      .post('/api/image/convert')
      .attach('file', sampleBuffer, 'sample.png')
      .field('format', 'bmp');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Format target tidak valid/i);
  });

  test('9. Validasi Format Target Kosong: Gagal jika format tidak diisi', async () => {
    const sampleBuffer = await createSampleImage(50, 50, 'png');

    const res = await request(app)
      .post('/api/image/convert')
      .attach('file', sampleBuffer, 'sample.png');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Format target konversi wajib diisi/i);
  });

  test('10. Validasi Format File Input: Gagal jika file input bukan format gambar', async () => {
    const textFile = Buffer.from('Ini dokumen teks, bukan gambar.');

    const res = await request(app)
      .post('/api/image/convert')
      .attach('file', textFile, 'doc.txt')
      .field('format', 'webp');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Hanya file format gambar/i);
  });
});

describe('Image Compress Feature Tests (POST /api/image/compress)', () => {
  test('1. Happy Path (Default Medium): Kompresi gambar PNG default level medium', async () => {
    const pngBuffer = await createSampleImage(2400, 1600, 'png');

    const res = await request(app)
      .post('/api/image/compress')
      .attach('file', pngBuffer, 'large_photo.png');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'image/png');
    assert.match(res.headers['content-disposition'], /compressed\.png/);

    const metadata = await sharp(res.body).metadata();
    assert.strictEqual(metadata.format, 'png');
    assert.strictEqual(metadata.width, 1920); // Resized down to max 1920 width
  });

  test('2. Happy Path (Low Level): Kompresi gambar JPG dengan level low tanpa resize', async () => {
    const jpgBuffer = await createSampleImage(800, 600, 'jpeg');

    const res = await request(app)
      .post('/api/image/compress')
      .attach('file', jpgBuffer, 'photo.jpg')
      .field('level', 'low');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'image/jpeg');
    assert.match(res.headers['content-disposition'], /compressed\.jpg/);

    const metadata = await sharp(res.body).metadata();
    assert.strictEqual(metadata.format, 'jpeg');
    assert.strictEqual(metadata.width, 800);
    assert.strictEqual(metadata.height, 600);
  });

  test('3. Happy Path (High Level): Kompresi gambar WebP dengan level high (resize max 1080 width)', async () => {
    const webpBuffer = await createSampleImage(2000, 1500, 'webp');

    const res = await request(app)
      .post('/api/image/compress')
      .attach('file', webpBuffer, 'image.webp')
      .field('level', 'high');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'image/webp');
    assert.match(res.headers['content-disposition'], /compressed\.webp/);

    const metadata = await sharp(res.body).metadata();
    assert.strictEqual(metadata.format, 'webp');
    assert.strictEqual(metadata.width, 1080);
  });

  test('4. Validasi Keberadaan File: Gagal jika file tidak dilampirkan', async () => {
    const res = await request(app)
      .post('/api/image/compress')
      .field('level', 'medium');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /File gambar wajib diunggah/i);
  });

  test('5. Validasi Ukuran File: Gagal jika ukuran file > 15 MB', async () => {
    const largeBuffer = Buffer.alloc(16 * 1024 * 1024, 0);

    const res = await request(app)
      .post('/api/image/compress')
      .attach('file', largeBuffer, 'huge_file.png')
      .field('level', 'medium');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /melebihi batas maksimal/i);
  });

  test('6. Validasi Resolusi Gambar: Gagal jika resolusi > 8000x8000', async () => {
    const hugeImage = await createSampleImage(8001, 50, 'png');

    const res = await request(app)
      .post('/api/image/compress')
      .attach('file', hugeImage, 'huge_resolution.png')
      .field('level', 'low');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /8000 x 8000/i);
  });

  test('7. Validasi Level Tidak Valid: Gagal jika level tidak didukung', async () => {
    const sampleBuffer = await createSampleImage(100, 100, 'png');

    const res = await request(app)
      .post('/api/image/compress')
      .attach('file', sampleBuffer, 'sample.png')
      .field('level', 'ultra');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Level kompresi tidak valid/i);
  });

  test('8. Validasi Format File Input: Gagal jika file input bukan format gambar', async () => {
    const textFile = Buffer.from('Bukan gambar');

    const res = await request(app)
      .post('/api/image/compress')
      .attach('file', textFile, 'notes.txt')
      .field('level', 'medium');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Hanya file format gambar/i);
  });
});

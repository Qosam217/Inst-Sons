process.env.NODE_ENV = 'test';
const { test, describe } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const { PDFDocument } = require('pdf-lib');
const app = require('../../server');

// Helper untuk membuat buffer PDF valid
async function createSamplePdf(text = 'Sample Page') {
  const doc = await PDFDocument.create();
  doc.addPage([300, 300]);
  return Buffer.from(await doc.save());
}

describe('PDF Merge Feature Tests (POST /api/pdf/merge)', () => {
  test('1. Happy Path: Menggabungkan 2 file PDF valid', async () => {
    const pdf1 = await createSamplePdf('Halaman 1');
    const pdf2 = await createSamplePdf('Halaman 2');

    const res = await request(app)
      .post('/api/pdf/merge')
      .attach('files', pdf1, 'doc1.pdf')
      .attach('files', pdf2, 'doc2.pdf');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'application/pdf');

    const mergedDoc = await PDFDocument.load(res.body);
    assert.strictEqual(mergedDoc.getPageCount(), 2);
  });

  test('2. Validasi Minimum File: Gagal jika hanya 1 file PDF', async () => {
    const pdf1 = await createSamplePdf('Halaman 1');

    const res = await request(app)
      .post('/api/pdf/merge')
      .attach('files', pdf1, 'doc1.pdf');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Minimal 2 file PDF/i);
  });

  test('3. Validasi Maksimum File: Gagal jika lebih dari 5 file PDF', async () => {
    const pdf = await createSamplePdf();

    const req = request(app).post('/api/pdf/merge');
    for (let i = 1; i <= 6; i++) {
      req.attach('files', pdf, `doc${i}.pdf`);
    }

    const res = await req;
    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Maksimal 5 file PDF|melebihi batas maksimal/i);
  });

  test('4. Validasi Ukuran per File: Gagal jika ukuran file > 10 MB', async () => {
    // 11 MB buffer
    const largePdf = Buffer.alloc(11 * 1024 * 1024, '%PDF-1.4 dummy large content...');
    const pdfSmall = await createSamplePdf();

    const res = await request(app)
      .post('/api/pdf/merge')
      .attach('files', largePdf, 'large.pdf')
      .attach('files', pdfSmall, 'small.pdf');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /10 MB/i);
  });

  test('5. Validasi Total Ukuran File: Gagal jika total ukuran > 30 MB', async () => {
    // 4 files x 8 MB = 32 MB (setiap file < 10 MB, tapi total > 30 MB)
    const eightMbBuffer = Buffer.alloc(8 * 1024 * 1024, '%PDF-1.4 dummy 8mb content...');

    const res = await request(app)
      .post('/api/pdf/merge')
      .attach('files', eightMbBuffer, 'doc1.pdf')
      .attach('files', eightMbBuffer, 'doc2.pdf')
      .attach('files', eightMbBuffer, 'doc3.pdf')
      .attach('files', eightMbBuffer, 'doc4.pdf');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /30 MB/i);
  });

  test('6. Validasi Format File: Gagal jika mengunggah file non-PDF', async () => {
    const pdf = await createSamplePdf();
    const textFile = Buffer.from('Ini file teks biasa, bukan PDF');

    const res = await request(app)
      .post('/api/pdf/merge')
      .attach('files', pdf, 'doc.pdf')
      .attach('files', textFile, 'test.txt');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Hanya file format PDF/i);
  });
});

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

// Helper untuk membuat buffer PDF valid dengan jumlah halaman tertentu
async function createMultiPagePdf(pageCount = 1) {
  const doc = await PDFDocument.create();
  for (let i = 1; i <= pageCount; i++) {
    doc.addPage([300, 300]);
  }
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

describe('PDF Split Feature Tests (POST /api/pdf/split)', () => {
  test('1. Happy Path: Memisahkan rentang halaman PDF valid (hal 2-4 dari 5 hal)', async () => {
    const pdf = await createMultiPagePdf(5);

    const res = await request(app)
      .post('/api/pdf/split')
      .attach('file', pdf, 'sample5pages.pdf')
      .field('startPage', '2')
      .field('endPage', '4');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'application/pdf');

    const resultDoc = await PDFDocument.load(res.body);
    assert.strictEqual(resultDoc.getPageCount(), 3);
  });

  test('2. Single Page Split: Memisahkan 1 halaman saja (hal 3 dari 5 hal)', async () => {
    const pdf = await createMultiPagePdf(5);

    const res = await request(app)
      .post('/api/pdf/split')
      .attach('file', pdf, 'sample5pages.pdf')
      .field('startPage', '3')
      .field('endPage', '3');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'application/pdf');

    const resultDoc = await PDFDocument.load(res.body);
    assert.strictEqual(resultDoc.getPageCount(), 1);
  });

  test('3. Validasi Keberadaan File: Gagal jika file tidak dilampirkan', async () => {
    const res = await request(app)
      .post('/api/pdf/split')
      .field('startPage', '1')
      .field('endPage', '2');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /File PDF wajib diunggah/i);
  });

  test('4. Validasi Ukuran File: Gagal jika ukuran file > 15 MB', async () => {
    // 16 MB buffer
    const largePdf = Buffer.alloc(16 * 1024 * 1024, '%PDF-1.4 dummy large content...');

    const res = await request(app)
      .post('/api/pdf/split')
      .attach('file', largePdf, 'large16mb.pdf')
      .field('startPage', '1')
      .field('endPage', '2');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /15 MB|melebihi batas maksimal/i);
  });

  test('5. Validasi Maks Halaman: Gagal jika PDF memiliki > 500 halaman', async () => {
    const pdf501 = await createMultiPagePdf(501);

    const res = await request(app)
      .post('/api/pdf/split')
      .attach('file', pdf501, '501pages.pdf')
      .field('startPage', '1')
      .field('endPage', '10');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /500 halaman/i);
  });

  test('6. Validasi Urutan Halaman: Gagal jika startPage > endPage', async () => {
    const pdf = await createMultiPagePdf(5);

    const res = await request(app)
      .post('/api/pdf/split')
      .attach('file', pdf, 'sample5pages.pdf')
      .field('startPage', '5')
      .field('endPage', '2');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /startPage tidak boleh lebih besar dari endPage/i);
  });

  test('7. Validasi Halaman di Luar Batas: Gagal jika halaman melebihi total halaman dokumen', async () => {
    const pdf = await createMultiPagePdf(5);

    const res = await request(app)
      .post('/api/pdf/split')
      .attach('file', pdf, 'sample5pages.pdf')
      .field('startPage', '1')
      .field('endPage', '10');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /melebihi total halaman PDF|Rentang halaman tidak valid/i);
  });

  test('8. Validasi Input Halaman: Gagal jika startPage atau endPage <= 0 atau non-angka', async () => {
    const pdf = await createMultiPagePdf(5);

    const resZero = await request(app)
      .post('/api/pdf/split')
      .attach('file', pdf, 'sample5pages.pdf')
      .field('startPage', '0')
      .field('endPage', '3');

    assert.strictEqual(resZero.statusCode, 400);
    assert.strictEqual(resZero.body.success, false);
    assert.match(resZero.body.message, /bilangan bulat positif/i);

    const resInvalid = await request(app)
      .post('/api/pdf/split')
      .attach('file', pdf, 'sample5pages.pdf')
      .field('startPage', 'abc')
      .field('endPage', 'xyz');

    assert.strictEqual(resInvalid.statusCode, 400);
    assert.strictEqual(resInvalid.body.success, false);
    assert.match(resInvalid.body.message, /bilangan bulat positif/i);
  });

  test('9. Validasi Format File: Gagal jika file bukan format PDF', async () => {
    const textFile = Buffer.from('Ini file teks biasa');

    const res = await request(app)
      .post('/api/pdf/split')
      .attach('file', textFile, 'document.txt')
      .field('startPage', '1')
      .field('endPage', '2');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Hanya file format PDF/i);
  });
});

describe('PDF Compress Feature Tests (POST /api/pdf/compress)', () => {
  test('1. Happy Path: Mengompresi file PDF valid dengan default level (medium)', async () => {
    const pdf = await createSamplePdf('Sample Compress PDF');

    const res = await request(app)
      .post('/api/pdf/compress')
      .attach('file', pdf, 'sample.pdf');

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers['content-type'], 'application/pdf');
    assert.match(res.headers['content-disposition'], /compressed\.pdf/);
    assert.ok(res.body.length > 0);
  });

  test('2. Happy Path: Mengompresi file PDF valid dengan custom level (low dan high)', async () => {
    const pdf = await createSamplePdf('Sample Compress Low & High');

    const resLow = await request(app)
      .post('/api/pdf/compress')
      .attach('file', pdf, 'sample.pdf')
      .field('level', 'low');

    assert.strictEqual(resLow.statusCode, 200);
    assert.strictEqual(resLow.headers['content-type'], 'application/pdf');

    const resHigh = await request(app)
      .post('/api/pdf/compress')
      .attach('file', pdf, 'sample.pdf')
      .field('level', 'high');

    assert.strictEqual(resHigh.statusCode, 200);
    assert.strictEqual(resHigh.headers['content-type'], 'application/pdf');
  });

  test('3. Validasi Keberadaan File: Gagal jika file tidak dilampirkan', async () => {
    const res = await request(app)
      .post('/api/pdf/compress')
      .field('level', 'medium');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /File PDF wajib diunggah/i);
  });

  test('4. Validasi Ukuran File: Gagal jika ukuran file > 15 MB', async () => {
    const largePdf = Buffer.alloc(16 * 1024 * 1024, '%PDF-1.4 dummy large content...');

    const res = await request(app)
      .post('/api/pdf/compress')
      .attach('file', largePdf, 'large16mb.pdf');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /15 MB|melebihi batas maksimal/i);
  });

  test('5. Validasi Level Kompresi: Gagal jika pilihan level tidak valid', async () => {
    const pdf = await createSamplePdf();

    const res = await request(app)
      .post('/api/pdf/compress')
      .attach('file', pdf, 'sample.pdf')
      .field('level', 'ultra_extreme');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Level kompresi tidak valid/i);
  });

  test('6. Validasi Format File: Gagal jika file bukan format PDF', async () => {
    const textFile = Buffer.from('Ini file teks biasa');

    const res = await request(app)
      .post('/api/pdf/compress')
      .attach('file', textFile, 'document.txt');

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /Hanya file format PDF/i);
  });
});


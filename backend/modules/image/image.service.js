// Scaffolding placeholder untuk modul Image (menggunakan sharp)

const compressImage = async (file, quality = 80) => {
  return {
    status: 'ready',
    fileName: file ? file.originalname : null,
    quality: Number(quality),
    action: 'compress',
  };
};

const convertImage = async (file, format = 'webp') => {
  return {
    status: 'ready',
    fileName: file ? file.originalname : null,
    targetFormat: format,
    action: 'convert',
  };
};

module.exports = {
  compressImage,
  convertImage,
};

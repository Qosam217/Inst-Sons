// Scaffolding placeholder untuk modul Audio (menggunakan fluent-ffmpeg)

const convertAudio = async (file, format = 'mp3') => {
  return {
    status: 'ready',
    fileName: file ? file.originalname : null,
    targetFormat: format,
    action: 'convert_audio',
  };
};

module.exports = {
  convertAudio,
};

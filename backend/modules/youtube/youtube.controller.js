const youtubeService = require('./youtube.service');

const getInfo = async (req, res, next) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL YouTube wajib disertakan' });
    }
    const info = await youtubeService.getVideoInfo(url);
    return res.status(200).json({
      success: true,
      data: info,
    });
  } catch (error) {
    next(error);
  }
};

const downloadAudio = async (req, res, next) => {
  try {
    const { url, quality } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'URL YouTube wajib disertakan' });
    }
    const result = await youtubeService.downloadAudio({ url, quality });
    return res.status(200).json({
      success: true,
      message: 'Download audio diproses (placeholder)',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInfo,
  downloadAudio,
};

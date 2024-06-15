const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

const downloadYouTubeVideo = async (url, videoOutput, audioOutput, audioConvertedOutput, finalOutput) => {
  try {
    // 動画と音声をそれぞれ一時ファイルに保存
    const videoStream = ytdl(url, { quality: 'highestvideo' });
    const audioStream = ytdl(url, { quality: 'highestaudio' });

    // 動画のダウンロード
    const videoDownload = new Promise((resolve, reject) => {
      videoStream
        .pipe(fs.createWriteStream(videoOutput))
        .on('finish', resolve)
        .on('error', reject);
    });

    // 音声のダウンロード
    const audioDownload = new Promise((resolve, reject) => {
      audioStream
        .pipe(fs.createWriteStream(audioOutput))
        .on('finish', resolve)
        .on('error', reject);
    });

    // 両方のダウンロードが完了するまで待つ
    await Promise.all([videoDownload, audioDownload]);

    // 音声をmp3に変換してから動画と結合
    ffmpeg(audioOutput)
      .toFormat('mp3')
      .on('end', () => {
        console.log('音声の変換が完了しました');
        ffmpeg()
          .input(videoOutput)
          .input(audioConvertedOutput)
          .videoCodec('copy')
          .audioCodec('copy')
          .save(finalOutput)
          .on('end', () => {
            console.log('音声ファイルと動画ファイルの結合が完了しました');
            // 一時ファイルを削除
            fs.unlinkSync(videoOutput);
            fs.unlinkSync(audioOutput);
            fs.unlinkSync(audioConvertedOutput);
          })
          .on('error', (err) => {
            console.error('結合処理中にエラーが発生しました', err);
          });
      })
      .on('error', (err) => {
        console.error('音声変換中にエラーが発生しました', err);
      })
      .save(audioConvertedOutput);

  } catch (error) {
    console.error('ダウンロード中にエラーが発生しました', error);
  }
};

// YouTubeのURLと出力ファイルのパスを指定
const youtubeURL = 'https://www.youtube.com/watch?v=VideoID';
const videoOutputPath = 'video.mp4';
const audioOutputPath = 'audio.webm'; // 元の音声ファイルをwebmに保存
const audioConvertedOutputPath = 'audio.mp3'; // 変換後の音声ファイルをmp3に保存
const finalOutputPath = 'FilePath.mp4';

downloadYouTubeVideo(youtubeURL, videoOutputPath, audioOutputPath, audioConvertedOutputPath, finalOutputPath);
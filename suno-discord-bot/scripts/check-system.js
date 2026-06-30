const { execFileSync } = require('child_process');
console.log('Node:', process.version);
try {
  const out = execFileSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  console.log('FFmpeg OK:', out.split('\n')[0]);
} catch (err) {
  console.log('FFmpeg was not found in PATH. Install FFmpeg or make sure C:\\ffmpeg\\bin is in Path.');
}
console.log('System check finished.');

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 이미지 디렉토리
const imagesDir = path.join(__dirname, '../frontend/src/assets/images');
const outputDir = path.join(__dirname, '../frontend/src/assets/images/optimized');

// 출력 디렉토리가 없으면 생성
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 이미지 파일 목록 가져오기
const imageFiles = fs.readdirSync(imagesDir).filter(file => {
  const ext = path.extname(file).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
});

console.log(`Found ${imageFiles.length} image files to optimize.`);

// 각 이미지 최적화
async function optimizeImages() {
  for (const file of imageFiles) {
    const inputPath = path.join(imagesDir, file);
    const outputPath = path.join(outputDir, file);
    const ext = path.extname(file).toLowerCase();
    
    try {
      // 파일 정보 조회
      const stats = fs.statSync(inputPath);
      console.log(`Processing: ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
      
      let sharpInstance = sharp(inputPath);
      
      // 이미지 크기 조정 (필요한 경우)
      const metadata = await sharpInstance.metadata();
      if (metadata.width > 1200) {
        sharpInstance = sharpInstance.resize(1200);
      }
      
      // 포맷별 최적화
      if (ext === '.jpg' || ext === '.jpeg') {
        await sharpInstance
          .jpeg({ quality: 80, progressive: true })
          .toFile(outputPath);
      } else if (ext === '.png') {
        await sharpInstance
          .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true })
          .toFile(outputPath);
      } else if (ext === '.gif') {
        // GIF는 그대로 복사 (Sharp가 애니메이션 GIF를 지원하지 않음)
        fs.copyFileSync(inputPath, outputPath);
      }
      
      // 최적화 결과 확인
      const optimizedStats = fs.statSync(outputPath);
      const savingsPercent = (100 - (optimizedStats.size / stats.size * 100)).toFixed(2);
      console.log(`Optimized: ${file} (${(optimizedStats.size / 1024).toFixed(2)} KB, saved ${savingsPercent}%)`);
    } catch (error) {
      console.error(`Error optimizing ${file}: ${error.message}`);
    }
  }
}

optimizeImages()
  .then(() => console.log('Image optimization complete!'))
  .catch(err => console.error('Optimization failed:', err));
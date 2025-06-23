// convert-to-readable.ts
// Simple script to convert your crawler output to readable format

import { createReadableCourseData } from './readable-course-transformer';
import path from 'path';

async function convertCourseData() {
  // UPDATE THESE PATHS to match your actual file locations
  const inputFile = path.join(__dirname, 'data', '202408.json');  // Your crawler output
  const outputFile = path.join(__dirname, 'data', 'readable-courses-fall-2024.json');
  
  try {
    console.log(`📂 Looking for course data at: ${inputFile}`);
    
    await createReadableCourseData(inputFile, outputFile);
    
    console.log('\n🎉 Conversion complete! Your readable course data is ready.');
    console.log(`📄 Output saved to: ${outputFile}`);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      console.error(`❌ File not found: ${inputFile}`);
      console.log('\n💡 Make sure to:');
      console.log('1. Run your crawler first: yarn start:windows');
      console.log('2. Check the data/ folder for your JSON file');
      console.log('3. Update the inputFile path in this script if needed');
    } else {
      console.error('❌ Conversion failed:', error);
    }
  }
}

// Allow command line arguments to specify different files
const args = process.argv.slice(2);
if (args.length >= 1) {
  const customInputFile = args[0];
  const customOutputFile = args[1] || customInputFile.replace('.json', '-readable.json');
  
  console.log(`Using custom files:`);
  console.log(`Input: ${customInputFile}`);
  console.log(`Output: ${customOutputFile}`);
  
  createReadableCourseData(customInputFile, customOutputFile)
    .then(() => console.log('✅ Done!'))
    .catch(console.error);
} else {
  convertCourseData();
}
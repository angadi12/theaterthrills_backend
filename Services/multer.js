// const fs = require('fs');
// const multer = require('multer');
// const path = require('path');

// // Ensure the uploads directory exists
// const uploadDir = path.join(__dirname, '../uploads');
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Configure multer storage
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir); // Local directory for temporary storage
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// const upload = multer({ storage: storage });

// module.exports = upload;
const multer = require('multer');

const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage });

module.exports = upload;

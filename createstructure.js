const fs = require('fs');
const path = require('path');
const structure = {
    "config": ["db.js"],
    "controllers": ["authController.js", "paymentController.js"],
    "middleware": ["authMiddleware.js"],
    "models": ["userModel.js", "transactionModel.js"],
    "routes": ["authRoutes.js", "paymentRoutes.js"],
    "scripts": ["deploy.sh"],
    "utils": ["qrGenerator.js", "logger.js"],
    "files": [".env", ".env.example", ".gitignore", "package.json", ".eslintrc.js", "server.js", "README.md"]
};
function createStructure(basePath, structure) {
  for (const [key, value] of Object.entries(structure)) {
    const folderPath = path.join(basePath, key);
    fs.mkdirSync(folderPath, { recursive: true });
    if (Array.isArray(value)) {
      value.forEach(file => {
        fs.writeFileSync(path.join(folderPath, file), '');
      });
    } else {
      createStructure(folderPath, value);
    }
  }
}

createStructure(__dirname, structure);
console.log("Folder structure created successfully!");

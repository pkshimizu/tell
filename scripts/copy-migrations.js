const fs = require('fs')
const path = require('path')

const srcMigrationsDir = path.join(__dirname, '../src/main/database/migrations')
const destMigrationsDir = path.join(__dirname, '../out/main/database/migrations')

// マイグレーションフォルダをコピー
function copyDir(src, dest) {
  // ディレクトリが存在しない場合は作成
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  // ディレクトリ内のファイルとフォルダを取得
  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

console.log('Copying migrations...')
copyDir(srcMigrationsDir, destMigrationsDir)
console.log('Migrations copied successfully')
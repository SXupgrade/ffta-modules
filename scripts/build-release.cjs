const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const packageJson = require(path.join(rootDir, 'package.json'));

const version = packageJson.version || '0.0.0';
const distDir = path.join(rootDir, 'dist');
const releaseDir = path.join(distDir, 'ffta-modules');
const zipPath = path.join(distDir, `ffta-modules-v${version}.zip`);
const crypto = require('crypto');

const includedPaths = [
  'api',
  'config',
  'core',
  'docs',
  'modules',
  'index.php',
  'main.js',
  'menu.php',
  'package.json',
  'README.md',
  'CHANGELOG.md',
  'LICENSE.md',
];

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(releaseDir, { recursive: true });

for (const item of includedPaths) {
  const source = path.join(rootDir, item);
  const target = path.join(releaseDir, item);

  if (!fs.existsSync(source)) {
    console.warn(`Skipped missing path: ${item}`);
    continue;
  }

  fs.cpSync(source, target, {
    recursive: true,
    force: true,
  });
}

if (process.platform === 'win32') {
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${releaseDir}' -DestinationPath '${zipPath}' -Force"`,
    { stdio: 'inherit' }
  );
} else {
  execSync(`cd "${distDir}" && zip -r "${zipPath}" ffta-modules`, {
    stdio: 'inherit',
  });
}

console.log(`Release archive created: ${zipPath}`);

const archiveBuffer = fs.readFileSync(zipPath);
const sha256 = crypto.createHash('sha256').update(archiveBuffer).digest('hex');

const updateManifest = {
  id: 'ffta-modules',
  version,
  channel: 'stable',
  asset: `ffta-modules-v${version}.zip`,
  sha256,
  minimumPhp: '7.4',
  notes: `Release ${version}`,
};

fs.writeFileSync(
  path.join(distDir, 'update-manifest.json'),
  JSON.stringify(updateManifest, null, 2),
  'utf8'
);

console.log(`Update manifest created: ${path.join(distDir, 'update-manifest.json')}`);
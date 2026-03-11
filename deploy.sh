# Update patch version, branch name, and commit hash in package.json
node -e "
const fs = require('fs');
const { execSync } = require('child_process');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = pkg.version.split('.');
version[2] = (parseInt(version[2]) + 1).toString();
pkg.version = version.join('.');
try {
  const branchName = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  pkg.deployment = {
    branch: branchName,
    commitHash: commitHash
  };
} catch (error) {
  pkg.deployment = {
    branch: 'N/A',
    commitHash: 'N/A'
  };
}
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('Updated version to:', pkg.version);
console.log('Branch:', pkg.deployment.branch);
console.log('Commit:', pkg.deployment.commitHash);
"

npm run build

cp -r ./dist/* ./production/

cd production

git add .
git commit -m "Deploy React app to GitHub Pages"
git push origin main

cd ..

git add .
git commit -m "Updated version"
git push origin master
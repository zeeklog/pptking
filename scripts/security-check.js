#!/usr/bin/env node

/**
 * 安全配置检查脚本
 * 用于检查项目中的安全配置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔒 开始安全配置检查...\n');

// 检查项目根目录
const projectRoot = path.resolve(__dirname, '..');

// 1. 检查环境变量文件
console.log('1. 检查环境变量文件...');
const envFiles = ['.env', '.env.local', '.env.production'];
envFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // 检查是否包含真实的 API KEY
    const apiKeyLines = lines.filter(line => 
      line.includes('API_KEY') && 
      !line.startsWith('#') && 
      line.includes('=') &&
      !line.includes('your_') &&
      !line.includes('example')
    );
    
    if (apiKeyLines.length > 0) {
      console.log(`   ⚠️  警告: ${file} 可能包含真实的 API KEY`);
      apiKeyLines.forEach(line => {
        const [key] = line.split('=');
        console.log(`      - ${key.trim()}`);
      });
    } else {
      console.log(`   ✅ ${file} 看起来是安全的`);
    }
  } else {
    console.log(`   ℹ️  ${file} 不存在`);
  }
});

// 2. 检查 package.json 中的脚本
console.log('\n2. 检查 package.json 脚本...');
const packageJsonPath = path.join(projectRoot, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const scripts = packageJson.scripts || {};
  
  Object.entries(scripts).forEach(([name, script]) => {
    if (typeof script === 'string' && script.includes('API_KEY')) {
      console.log(`   ⚠️  警告: 脚本 "${name}" 可能暴露 API KEY`);
    }
  });
  console.log('   ✅ package.json 脚本看起来是安全的');
}

// 3. 检查 .gitignore
console.log('\n3. 检查 .gitignore...');
const gitignorePath = path.join(projectRoot, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const content = fs.readFileSync(gitignorePath, 'utf8');
  const lines = content.split('\n');
  
  const requiredIgnores = [
    '.env',
    '.env.local',
    '.env.production',
    'node_modules',
    '.next',
    'dist',
    'build'
  ];
  
  const missing = requiredIgnores.filter(item => 
    !lines.some(line => line.trim() === item || line.trim() === `/${item}`)
  );
  
  if (missing.length > 0) {
    console.log(`   ⚠️  警告: .gitignore 缺少以下项目:`);
    missing.forEach(item => console.log(`      - ${item}`));
  } else {
    console.log('   ✅ .gitignore 配置正确');
  }
} else {
  console.log('   ⚠️  警告: .gitignore 文件不存在');
}

// 4. 检查敏感文件
console.log('\n4. 检查敏感文件...');
const sensitiveFiles = [
  '.env',
  '.env.local',
  '.env.production',
  'secrets.json',
  'config.json',
  'credentials.json'
];

sensitiveFiles.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ⚠️  警告: 发现敏感文件 ${file}`);
  }
});

// 5. 检查代码中的硬编码 API KEY
console.log('\n5. 检查代码中的硬编码 API KEY...');
const sourceDirs = ['app', 'src', 'components', 'pages'];
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

function checkFileForApiKeys(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      // 检查是否包含看起来像 API KEY 的字符串
      if (trimmedLine.includes('sk-') && trimmedLine.length > 20) {
        console.log(`   ⚠️  警告: ${filePath}:${index + 1} 可能包含硬编码的 API KEY`);
      }
    });
  } catch (error) {
    // 忽略无法读取的文件
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (extensions.some(ext => file.endsWith(ext))) {
      checkFileForApiKeys(filePath);
    }
  });
}

sourceDirs.forEach(dir => {
  const dirPath = path.join(projectRoot, dir);
  if (fs.existsSync(dirPath)) {
    walkDir(dirPath);
  }
});

console.log('\n✅ 安全配置检查完成！');
console.log('\n📋 安全建议:');
console.log('1. 确保所有 API KEY 都通过环境变量配置');
console.log('2. 不要在代码中硬编码任何敏感信息');
console.log('3. 确保 .gitignore 正确配置');
console.log('4. 定期轮换 API KEY');
console.log('5. 使用最小权限原则配置 API KEY');
console.log('6. 监控 API KEY 的使用情况');

#!/usr/bin/env node

/**
 * AI Chat Studio - 安全配置检查工具
 *
 * 此脚本检查生产环境配置是否安全
 *
 * 使用方法:
 *   node security-check.js
 *
 * 或添加到 package.json:
 *   "scripts": { "security-check": "node security-check.js" }
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('\n' + '='.repeat(70));
  log(message, 'blue');
  console.log('='.repeat(70));
}

// 读取环境文件
function loadEnvFile(filename) {
  const filepath = path.join(process.cwd(), filename);

  if (!fs.existsSync(filepath)) {
    return null;
  }

  const content = fs.readFileSync(filepath, 'utf-8');
  const env = {};

  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

// 安全检查
class SecurityChecker {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = 0;
  }

  check(condition, passMessage, failMessage, isWarning = false) {
    if (condition) {
      this.passed++;
      log(`  ✓ ${passMessage}`, 'green');
    } else {
      if (isWarning) {
        this.warnings.push(failMessage);
        log(`  ⚠ ${failMessage}`, 'yellow');
      } else {
        this.issues.push(failMessage);
        log(`  ✗ ${failMessage}`, 'red');
      }
    }
  }

  hasIssues() {
    return this.issues.length > 0;
  }

  summary() {
    header('检查摘要');
    log(`通过: ${this.passed}`, 'green');
    log(`警告: ${this.warnings.length}`, 'yellow');
    log(`错误: ${this.issues.length}`, 'red');

    if (this.issues.length > 0) {
      log('\n必须修复的问题:', 'red');
      this.issues.forEach((issue, i) => {
        log(`  ${i + 1}. ${issue}`, 'red');
      });
    }

    if (this.warnings.length > 0) {
      log('\n建议修复的问题:', 'yellow');
      this.warnings.forEach((warning, i) => {
        log(`  ${i + 1}. ${warning}`, 'yellow');
      });
    }

    return !this.hasIssues();
  }
}

// 生成随机密钥
function generateSecretKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// 主检查函数
function runSecurityCheck() {
  header('AI Chat Studio - 生产环境安全检查');

  const checker = new SecurityChecker();

  // 1. 检查 .env.production 文件
  header('1. 配置文件检查');

  const prodEnv = loadEnvFile('.env.production');

  checker.check(
    prodEnv !== null,
    '找到 .env.production 文件',
    '.env.production 文件不存在！请从 .env.production.template 复制并配置'
  );

  if (!prodEnv) {
    log('\n提示: 运行以下命令创建配置文件:', 'blue');
    log('  cp .env.production.template .env.production', 'gray');
    return checker.summary();
  }

  // 2. 检查密钥安全性
  header('2. 密钥安全性检查');

  const secretKey = prodEnv.VITE_APP_SECRET_KEY || '';
  checker.check(
    secretKey && secretKey !== 'CHANGE_THIS_TO_A_SECURE_RANDOM_KEY_AT_LEAST_32_CHARACTERS',
    'APP_SECRET_KEY 已修改',
    'APP_SECRET_KEY 使用了默认值！必须更改为随机密钥'
  );

  checker.check(
    secretKey.length >= 32,
    `SECRET_KEY 长度足够 (${secretKey.length} 字符)`,
    `SECRET_KEY 长度不足 (${secretKey.length} < 32)`,
    true
  );

  const jwtSecret = prodEnv.VITE_JWT_SECRET || '';
  checker.check(
    jwtSecret && jwtSecret !== 'CHANGE_THIS_TO_A_SECURE_JWT_SECRET',
    'JWT_SECRET 已修改',
    'JWT_SECRET 使用了默认值！必须更改'
  );

  const encryptionKey = prodEnv.VITE_ENCRYPTION_KEY || '';
  checker.check(
    encryptionKey && encryptionKey !== 'CHANGE_THIS_TO_A_32_CHARACTER_ENCRYPTION_KEY',
    'ENCRYPTION_KEY 已修改',
    'ENCRYPTION_KEY 使用了默认值！必须更改'
  );

  checker.check(
    encryptionKey.length === 32,
    'ENCRYPTION_KEY 长度正确 (32 字符)',
    `ENCRYPTION_KEY 长度错误 (${encryptionKey.length} ≠ 32)`,
    true
  );

  // 3. 检查调试模式
  header('3. 调试模式检查');

  const debugMode = prodEnv.VITE_DEBUG_MODE || 'false';
  checker.check(
    debugMode.toLowerCase() === 'false',
    '调试模式已关闭',
    '调试模式仍然开启！生产环境必须关闭'
  );

  const showDocs = prodEnv.VITE_SHOW_API_DOCS || 'false';
  checker.check(
    showDocs.toLowerCase() === 'false',
    'API 文档已隐藏',
    'API 文档仍然显示，建议在生产环境关闭',
    true
  );

  // 4. 检查 CORS 配置
  header('4. CORS 安全检查');

  const allowedOrigins = prodEnv.VITE_ALLOWED_ORIGINS || '';
  checker.check(
    allowedOrigins && !allowedOrigins.includes('*') && !allowedOrigins.includes('localhost'),
    'CORS 配置安全',
    'CORS 配置不安全！不应包含 * 或 localhost'
  );

  // 5. 检查 API 配置
  header('5. API 配置检查');

  const hasOpenAI = prodEnv.VITE_OPENAI_API_KEY && prodEnv.VITE_OPENAI_API_KEY.length > 20;
  const hasAnthropic = prodEnv.VITE_ANTHROPIC_API_KEY && prodEnv.VITE_ANTHROPIC_API_KEY.length > 20;
  const hasGoogle = prodEnv.VITE_GOOGLE_API_KEY && prodEnv.VITE_GOOGLE_API_KEY.length > 20;
  const hasBackend = prodEnv.VITE_API_BASE_URL && prodEnv.VITE_API_BASE_URL !== '';

  checker.check(
    hasOpenAI || hasAnthropic || hasGoogle || hasBackend,
    '至少配置了一个 AI 服务',
    '未配置任何 AI 服务！应用可能无法正常工作',
    true
  );

  if (hasBackend) {
    checker.check(
      prodEnv.VITE_API_BASE_URL.startsWith('https://'),
      '后端 API 使用 HTTPS',
      '后端 API 未使用 HTTPS！生产环境必须使用 HTTPS'
    );

    checker.check(
      prodEnv.VITE_WS_URL && prodEnv.VITE_WS_URL.startsWith('wss://'),
      'WebSocket 使用 WSS',
      'WebSocket 未使用 WSS！生产环境必须使用安全连接'
    );
  }

  // 6. 检查日志级别
  header('6. 日志配置检查');

  const logLevel = prodEnv.VITE_LOG_LEVEL || 'info';
  checker.check(
    ['warn', 'error'].includes(logLevel.toLowerCase()),
    `日志级别设置合理 (${logLevel})`,
    `日志级别过高 (${logLevel})，建议设为 warn 或 error`,
    true
  );

  // 7. 检查功能开关
  header('7. 功能开关检查');

  const codeExecution = prodEnv.VITE_ENABLE_CODE_EXECUTION || 'false';
  checker.check(
    codeExecution.toLowerCase() === 'false',
    '代码执行功能已关闭',
    '代码执行功能仍然开启，存在安全风险！建议在生产环境关闭',
    true
  );

  // 8. 检查 .gitignore
  header('8. .gitignore 检查');

  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    checker.check(
      gitignoreContent.includes('.env.production') || gitignoreContent.includes('.env*.local'),
      '.env.production 已添加到 .gitignore',
      '.env.production 未在 .gitignore 中！必须添加以防止泄露敏感信息'
    );
  } else {
    checker.check(false, '', '.gitignore 文件不存在', true);
  }

  // 9. 生成建议
  if (checker.hasIssues()) {
    header('建议的修复步骤');
    log('1. 生成新的密钥:', 'blue');
    log(`   SECRET_KEY: ${generateSecretKey(32)}`, 'gray');
    log(`   JWT_SECRET: ${generateSecretKey(32)}`, 'gray');
    log(`   ENCRYPTION_KEY: ${generateSecretKey(16)}`, 'gray');
    log('\n2. 更新 .env.production 文件中的对应值', 'blue');
    log('3. 确保 DEBUG_MODE=false', 'blue');
    log('4. 配置正确的 ALLOWED_ORIGINS', 'blue');
    log('5. 重新运行此检查脚本', 'blue');
  }

  // 10. 最终摘要
  const passed = checker.summary();

  if (passed) {
    log('\n🎉 安全检查通过！您的配置符合生产环境标准。', 'green');
    return 0;
  } else {
    log('\n❌ 安全检查失败！请修复上述问题后再部署。', 'red');
    return 1;
  }
}

// 运行检查
try {
  const exitCode = runSecurityCheck();
  process.exit(exitCode);
} catch (error) {
  log(`\n检查过程出错: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}

#!/usr/bin/env node

/**
 * 构建后脚本集中管理
 * 在此文件中统一调用所有需要在构建后执行的脚本
 */

import { convertDeployConfig } from './convert-deploy-config.js';

console.log('🚀 开始执行构建后脚本...\n');

// 1. 生成部署配置文件
console.log('📝 [1/1] 生成部署配置文件');
convertDeployConfig();

console.log('\n✅ 所有构建后脚本执行完成！');

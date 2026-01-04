#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Run this script to check if all required environment variables are set
 */

const requiredEnvVars = {
  // Supabase Configuration (Required)
  'NEXT_PUBLIC_SUPABASE_URL': 'Supabase project URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': 'Supabase anon/public key',
  'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key (for server-side operations)',
};

const optionalEnvVars = {
  // WeChat Configuration (Optional)
  'WECHAT_APPID': 'WeChat app ID',
  'WECHAT_APP_SECRET': 'WeChat app secret',
  'NEXT_PUBLIC_WECHAT_APPID': 'WeChat app ID (public)',
  'NEXT_PUBLIC_SUPABASE_WECHAT_CALLBACK': 'WeChat callback URL',
  
  // SiliconFlow Configuration (Optional)
  'SILICONFLOW_URL': 'SiliconFlow API URL',
  'SILICONFLOW_API_KEY': 'SiliconFlow API key',
  
  // OpenAI Configuration (Optional)
  'OPENAI_API_KEY': 'OpenAI API key',
  'OPENAI_ORG_ID': 'OpenAI organization ID',
  
  // Feature Flags (Optional)
  'CODE': 'Access code',
  'HIDE_USER_API_KEY': 'Hide user API key input',
  'DISABLE_GPT4': 'Disable GPT-4',
  'ENABLE_BALANCE_QUERY': 'Enable balance query',
  'DISABLE_FAST_LINK': 'Disable fast link parsing',
};

let hasErrors = false;
let hasWarnings = false;

// Check required environment variables
for (const [key, description] of Object.entries(requiredEnvVars)) {
  const value = process.env[key];
  if (value) {
    console.log(`  ✅ ${key}: ${description}`);
  } else {
    console.log(`  ❌ ${key}: ${description} - MISSING`);
    hasErrors = true;
  }
}

// Check optional environment variables
for (const [key, description] of Object.entries(optionalEnvVars)) {
  const value = process.env[key];
  if (value) {
    console.log(`  ✅ ${key}: ${description}`);
  } else {
    console.log(`  ⚠️  ${key}: ${description} - Not set`);
    hasWarnings = true;
  }
}

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('\n❌ Validation failed! Missing required environment variables.');
  console.log('\nTo fix this:');
  console.log('1. Copy env.example to .env.local');
  console.log('2. Fill in the required values');
  console.log('3. For Cloudflare Pages, add the environment variables in the dashboard');
  process.exit(1);
} else if (hasWarnings) {
  console.log('\n⚠️  Validation passed with warnings. Some optional features may not work.');
} else {
  console.log('\n✅ All environment variables are properly configured!');
}

console.log('\n📚 For more information, see:');
console.log('- cloudflare-pages-cn.md (deployment guide)');
console.log('- scripts/get-supabase-keys.md (how to get Supabase keys)');
console.log('- env.example (template file)');

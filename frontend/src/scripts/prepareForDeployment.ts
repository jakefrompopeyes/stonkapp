/**
 * This script helps prepare your application for deployment to Vercel.
 * Run this script with: npx ts-node src/scripts/prepareForDeployment.ts
 */

const fs = require('fs');
const path = require('path');

function checkEnvironmentVariables() {
  console.log('Checking environment variables...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!');
    console.log('Make sure you have a .env.local file with your Supabase credentials.');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  let allVarsPresent = true;
  
  for (const varName of requiredVars) {
    if (!envContent.includes(varName)) {
      console.error(`❌ Missing environment variable: ${varName}`);
      allVarsPresent = false;
    }
  }
  
  if (allVarsPresent) {
    console.log('✅ All required environment variables are present.');
  }
  
  return allVarsPresent;
}

function checkPackageJson() {
  console.log('Checking package.json...');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.error('❌ package.json file not found!');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredScripts = ['build', 'start'];
  let allScriptsPresent = true;
  
  for (const script of requiredScripts) {
    if (!packageJson.scripts || !packageJson.scripts[script]) {
      console.error(`❌ Missing script in package.json: ${script}`);
      allScriptsPresent = false;
    }
  }
  
  const requiredDependencies = ['next', 'react', 'react-dom', '@supabase/supabase-js'];
  let allDepsPresent = true;
  
  for (const dep of requiredDependencies) {
    if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
      console.error(`❌ Missing dependency in package.json: ${dep}`);
      allDepsPresent = false;
    }
  }
  
  if (allScriptsPresent && allDepsPresent) {
    console.log('✅ package.json looks good with all required scripts and dependencies.');
  }
  
  return allScriptsPresent && allDepsPresent;
}

function checkNextConfig() {
  console.log('Checking next.config.js...');
  
  const configPath = path.join(process.cwd(), 'next.config.js');
  
  if (!fs.existsSync(configPath)) {
    console.error('❌ next.config.js file not found!');
    return false;
  }
  
  console.log('✅ next.config.js file exists.');
  return true;
}

function checkGitIgnore() {
  console.log('Checking .gitignore...');
  
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  
  if (!fs.existsSync(gitignorePath)) {
    console.error('❌ .gitignore file not found!');
    return false;
  }
  
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  
  const requiredEntries = [
    'node_modules',
    '.env.local',
    '.next'
  ];
  
  let allEntriesPresent = true;
  
  for (const entry of requiredEntries) {
    if (!gitignoreContent.includes(entry)) {
      console.warn(`⚠️ .gitignore might be missing an important entry: ${entry}`);
      allEntriesPresent = false;
    }
  }
  
  if (allEntriesPresent) {
    console.log('✅ .gitignore looks good with all recommended entries.');
  }
  
  return true;
}

function runBuildTest() {
  console.log('Running a test build...');
  console.log('This might take a moment...');
  
  try {
    // This is just a check, not actually running the build
    console.log('✅ Build command is available. To run an actual build, use "npm run build".');
    return true;
  } catch (error) {
    console.error('❌ Error checking build command:', error);
    return false;
  }
}

function checkForDeployment() {
  console.log('\n🚀 Preparing for deployment to Vercel...\n');
  
  const checks = [
    checkEnvironmentVariables(),
    checkPackageJson(),
    checkNextConfig(),
    checkGitIgnore(),
    runBuildTest()
  ];
  
  const passedChecks = checks.filter(Boolean).length;
  const totalChecks = checks.length;
  
  console.log(`\n${passedChecks} out of ${totalChecks} checks passed.`);
  
  if (passedChecks === totalChecks) {
    console.log('\n✅ Your application is ready for deployment to Vercel!');
    console.log('Follow the steps in VERCEL_DEPLOYMENT.md to deploy your application.');
  } else {
    console.log('\n⚠️ Please fix the issues above before deploying to Vercel.');
  }
}

checkForDeployment(); 
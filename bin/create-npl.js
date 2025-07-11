#!/usr/bin/env node

import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
  .name('create-npl')
  .description('Create a new NPL frontend project')
  .option('-c, --config <path>', 'Path to frontend-config.ts file', './frontend-config.ts')
  .option('-d, --directory <path>', 'Directory to create the frontend in', './frontend')
  .option('-a, --auto', 'Run with minimal prompts, using sensible defaults')
  .parse();

const options = program.opts();

async function checkFrontendConfig(configPath) {
  const absolutePath = path.resolve(configPath);
  if (await fs.exists(absolutePath)) {
    console.log(chalk.green(`✓ Found frontend-config.ts at ${absolutePath}`));
    return absolutePath;
  } else {
    console.log(chalk.yellow(`⚠ No frontend-config.ts found at ${absolutePath}`));
    
    let createConfig = true;
    if (!options.auto) {
      const response = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createConfig',
          message: 'Would you like to create a template frontend-config.ts?',
          default: true
        }
      ]);
      createConfig = response.createConfig;
    } else {
      console.log(chalk.blue('Auto mode: Creating template frontend-config.ts'));
    }
    
    if (createConfig) {
      await createFrontendConfigTemplate(absolutePath);
      return absolutePath;
    } else {
      console.log(chalk.red('✗ frontend-config.ts is required. Exiting.'));
      process.exit(1);
    }
  }
}

async function createFrontendConfigTemplate(configPath) {
  const template = `// NPL Frontend Configuration
// Update these values with your actual endpoints and credentials

export const NPL_TOKEN_ENDPOINT = "https://keycloak-your-domain.com/realms/your-realm/protocol/openid-connect/token";
export const NPL_CLIENT_ID = "your-client-id";
export const NPL_APPLICATION_URL = "https://engine-your-domain.com";
export const NPL_SWAGGER_URL = "https://engine-your-domain.com/npl/your-package/-/openapi.json";
`;

  await fs.writeFile(configPath, template);
  console.log(chalk.green(`✓ Created template frontend-config.ts at ${configPath}`));
  console.log(chalk.yellow('⚠ Please update the values in frontend-config.ts before running the application'));
}

async function createFrontendStructure(frontendDir, configPath) {
  console.log(chalk.blue('\n🏗  Creating frontend structure...'));
  
  await fs.ensureDir(frontendDir);
  await fs.ensureDir(path.join(frontendDir, 'src'));
  await fs.ensureDir(path.join(frontendDir, 'src/services'));
  
  console.log(chalk.green('✓ Created directory structure'));
}

async function createPackageJson(frontendDir) {
  const packageJson = {
    name: "npl-frontend",
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc && vite build",
      preview: "vite preview",
      "generate-api": "npx @hey-api/openapi-ts --input $NPL_SWAGGER_URL --output src/api.ts"
    },
    devDependencies: {
      "@hey-api/openapi-ts": "^0.45.1",
      "@types/node": "^20.10.5",
      "typescript": "^5.3.3",
      "vite": "^5.0.10"
    },
    dependencies: {
      "lit-html": "^3.1.0"
    }
  };
  
  await fs.writeJSON(path.join(frontendDir, 'package.json'), packageJson, { spaces: 2 });
  console.log(chalk.green('✓ Created package.json'));
}

async function createTsConfig(frontendDir) {
  const tsConfig = {
    compilerOptions: {
      target: "es2020",
      module: "ESNext",
      moduleResolution: "bundler",
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      types: ["vite/client"],
      baseUrl: ".",
      paths: {
        "frontend-config": ["../frontend-config.ts"]
      }
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"]
  };
  
  await fs.writeJSON(path.join(frontendDir, 'tsconfig.json'), tsConfig, { spaces: 2 });
  console.log(chalk.green('✓ Created tsconfig.json'));
}

async function createViteConfig(frontendDir) {
  const viteConfig = `import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'frontend-config': path.resolve(__dirname, '../frontend-config.ts')
    }
  },
  build: {
    target: 'es2020',
    outDir: 'dist'
  }
});
`;
  
  await fs.writeFile(path.join(frontendDir, 'vite.config.ts'), viteConfig);
  console.log(chalk.green('✓ Created vite.config.ts'));
}

async function createAuthService(frontendDir) {
  const authService = `import { NPL_TOKEN_ENDPOINT, NPL_CLIENT_ID } from 'frontend-config';

export interface Credentials {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export const authenticate = async (credentials: Credentials): Promise<TokenResponse> => {
  const response = await fetch(NPL_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      username: credentials.username,
      password: credentials.password,
      client_id: NPL_CLIENT_ID,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Authentication failed');
  }
  
  return response.json();
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return token ? { Authorization: \`Bearer \${token}\` } : {};
};
`;
  
  await fs.writeFile(path.join(frontendDir, 'src/services/auth.ts'), authService);
  console.log(chalk.green('✓ Created auth service'));
}

async function createMainTs(frontendDir) {
  const mainTs = `import { html, render } from 'lit-html';
import { NPL_APPLICATION_URL } from 'frontend-config';
import { authenticate, setAuthToken, getAuthToken, clearAuthToken } from './services/auth';

interface AppState {
  isAuthenticated: boolean;
  username: string;
  password: string;
  error: string | null;
}

const state: AppState = {
  isAuthenticated: !!getAuthToken(),
  username: '',
  password: '',
  error: null
};

const loginTemplate = () => html\`
  <div class="login-container">
    <h1>NPL Frontend</h1>
    <form @submit=\${handleLogin}>
      <input
        type="text"
        placeholder="Username"
        .value=\${state.username}
        @input=\${(e: Event) => state.username = (e.target as HTMLInputElement).value}
      />
      <input
        type="password"
        placeholder="Password"
        .value=\${state.password}
        @input=\${(e: Event) => state.password = (e.target as HTMLInputElement).value}
      />
      <button type="submit">Login</button>
      \${state.error ? html\`<p class="error">\${state.error}</p>\` : ''}
    </form>
  </div>
\`;

const appTemplate = () => html\`
  <div class="app-container">
    <header>
      <h1>NPL Application</h1>
      <button @click=\${handleLogout}>Logout</button>
    </header>
    <main>
      <p>Connected to: \${NPL_APPLICATION_URL}</p>
      <p>Successfully authenticated! Add your NPL protocol management UI here.</p>
    </main>
  </div>
\`;

async function handleLogin(e: Event) {
  e.preventDefault();
  state.error = null;
  
  try {
    const response = await authenticate({
      username: state.username,
      password: state.password
    });
    
    setAuthToken(response.access_token);
    state.isAuthenticated = true;
    state.username = '';
    state.password = '';
    renderApp();
  } catch (error) {
    state.error = 'Login failed. Please check your credentials.';
    renderApp();
  }
}

function handleLogout() {
  clearAuthToken();
  state.isAuthenticated = false;
  renderApp();
}

function renderApp() {
  const template = state.isAuthenticated ? appTemplate() : loginTemplate();
  render(template, document.getElementById('app')!);
}

renderApp();
`;
  
  await fs.writeFile(path.join(frontendDir, 'src/main.ts'), mainTs);
  console.log(chalk.green('✓ Created main.ts'));
}

async function createIndexHtml(frontendDir) {
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NPL Frontend</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f5f5f5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .login-container {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      width: 100%;
      max-width: 400px;
    }
    
    .login-container h1 {
      margin-bottom: 1.5rem;
      text-align: center;
      color: #333;
    }
    
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    input {
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    
    button {
      padding: 0.75rem;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    
    button:hover {
      background-color: #0056b3;
    }
    
    .error {
      color: #dc3545;
      margin-top: 0.5rem;
      text-align: center;
    }
    
    .app-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }
    
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid #ddd;
      margin-bottom: 2rem;
    }
    
    main {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
`;
  
  await fs.writeFile(path.join(frontendDir, 'index.html'), indexHtml);
  console.log(chalk.green('✓ Created index.html'));
}

async function createViteEnvTypes(frontendDir) {
  const viteEnvDts = `/// <reference types="vite/client" />
`;
  
  await fs.writeFile(path.join(frontendDir, 'src/vite-env.d.ts'), viteEnvDts);
  console.log(chalk.green('✓ Created vite-env.d.ts'));
}

async function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit', shell: true });
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  console.log(chalk.bold.blue('\n🚀 NPL Frontend Setup\n'));
  
  const configPath = await checkFrontendConfig(options.config);
  const frontendDir = path.resolve(options.directory);
  
  if (await fs.exists(frontendDir)) {
    let overwrite = options.auto;
    if (!options.auto) {
      const response = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Directory ${frontendDir} already exists. Overwrite?`,
          default: false
        }
      ]);
      overwrite = response.overwrite;
    } else {
      console.log(chalk.blue(`Auto mode: Overwriting existing directory ${frontendDir}`));
    }
    
    if (!overwrite) {
      console.log(chalk.yellow('Setup cancelled.'));
      process.exit(0);
    }
    
    await fs.remove(frontendDir);
  }
  
  await createFrontendStructure(frontendDir, configPath);
  await createPackageJson(frontendDir);
  await createTsConfig(frontendDir);
  await createViteConfig(frontendDir);
  await createAuthService(frontendDir);
  await createMainTs(frontendDir);
  await createIndexHtml(frontendDir);
  await createViteEnvTypes(frontendDir);
  
  console.log(chalk.blue('\n📦 Installing dependencies...'));
  await runCommand('npm', ['install'], frontendDir);
  
  const configData = await fs.readFile(configPath, 'utf-8');
  const hasValidSwaggerUrl = !configData.includes('your-domain.com');
  
  if (hasValidSwaggerUrl || options.auto) {
    let generateApi = options.auto;
    if (!options.auto) {
      const response = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'generateApi',
          message: 'Would you like to generate the API client now?',
          default: true
        }
      ]);
      generateApi = response.generateApi;
    } else {
      if (!hasValidSwaggerUrl) {
        console.log(chalk.yellow('Auto mode: Skipping API generation (placeholder URLs detected)'));
        generateApi = false;
      } else {
        console.log(chalk.blue('Auto mode: Generating API client'));
      }
    }
    
    if (generateApi) {
      console.log(chalk.blue('\n🔧 Generating API client...'));
      const swaggerUrlMatch = configData.match(/NPL_SWAGGER_URL\s*=\s*"([^"]+)"/);
      if (swaggerUrlMatch) {
        const swaggerUrl = swaggerUrlMatch[1];
        await runCommand('npx', ['@hey-api/openapi-ts', '--input', swaggerUrl, '--output', 'src/api.ts'], frontendDir);
      }
    }
  }
  
  console.log(chalk.blue('\n🔨 Building project...'));
  await runCommand('npm', ['run', 'build'], frontendDir);
  
  console.log(chalk.bold.green('\n✅ NPL Frontend setup complete!\n'));
  console.log(chalk.white('Next steps:'));
  if (!hasValidSwaggerUrl) {
    console.log(chalk.gray('1. Update frontend-config.ts with your actual values'));
    console.log(chalk.gray('2. cd ' + path.relative(process.cwd(), frontendDir)));
    console.log(chalk.gray('3. npm run generate-api'));
    console.log(chalk.gray('4. npm run dev'));
  } else {
    console.log(chalk.gray('1. cd ' + path.relative(process.cwd(), frontendDir)));
    console.log(chalk.gray('2. npm run dev'));
  }
  console.log(chalk.gray('\nFor API regeneration: npm run generate-api'));
}

main().catch((error) => {
  console.error(chalk.red('\n❌ Error:'), error.message);
  process.exit(1);
}); 

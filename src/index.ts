#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';
import axios from 'axios';
import mustache from 'mustache';

const log = (msg: string) => console.log(msg);

async function main() {
    yargs(hideBin(process.argv))
      .command(
        '$0',
        'Create a new NPL frontend project',
        (yargs) => {
          return yargs
            .option('name', {
                alias: 'n',
                describe: 'The name of the project and directory to create',
                type: 'string',
                demandOption: true,
            })
            .option('tenant', {
              alias: 't',
              describe: 'The tenant slug',
              type: 'string',
              demandOption: true,
            })
            .option('app', {
              alias: 'a',
              describe: 'The application slug',
              type: 'string',
              demandOption: true,
            })
            .option('package', {
              alias: 'p',
              describe: 'The NPL package name',
              type: 'string',
              demandOption: true,
            })
            .option('force', {
              alias: 'f',
              describe: 'Force overwrite of existing directory',
              type: 'boolean',
              default: false,
            });
        },
        async (argv) => {
            if (!argv.name) {
                console.error(chalk.red('Error: Project name is required.'));
                process.exit(1);
            }
            const projectDir = path.resolve(process.cwd(), argv.name);

            log(chalk.blue(`🚀 Creating new project in ${projectDir}`));

            if (fs.existsSync(projectDir) && fs.readdirSync(projectDir).length > 0) {
                if (argv.force) {
                    log(chalk.yellow(`⚠️  Directory ${projectDir} not empty. --force is set, removing...`));
                    fs.removeSync(projectDir);
                } else {
                    log(chalk.red(`❌ Directory ${projectDir} already exists and is not empty. Use --force to overwrite.`));
                    process.exit(1);
                }
            }
            fs.mkdirSync(projectDir, { recursive: true });

            const templateDir = path.resolve(__dirname, '../templates');
            log(`📁 Copying template files from ${templateDir}`);
            fs.copySync(templateDir, projectDir);

            log('✏️  Populating templates...');
            const view = {
                name: argv.name,
                tenant: argv.tenant,
                app: argv.app,
                package: argv.package,
            };

            const filesToTemplate = [
                'package.json',
                '.env',
                'index.html'
            ];

            for (const file of filesToTemplate) {
                const filePath = path.join(projectDir, file);
                const template = fs.readFileSync(filePath, 'utf8');
                const rendered = mustache.render(template, view);
                fs.writeFileSync(filePath, rendered, 'utf8');
            }
            
            const openapiDir = path.join(projectDir, 'openapi');
            fs.mkdirSync(openapiDir, { recursive: true });
            const openapiUrl = `https://engine-${argv.tenant}-${argv.app}.noumena.cloud/npl/${argv.package}/-/openapi.json`;
            const openapiPath = path.join(openapiDir, `${argv.package}-openapi.json`);
            
            log(`📄 Downloading OpenAPI spec from ${openapiUrl}`);
            try {
                const response = await axios.get(openapiUrl);
                fs.writeFileSync(openapiPath, JSON.stringify(response.data, null, 2));
            } catch (error) {
                log(chalk.red(`❌ Failed to download OpenAPI spec: ${error}`));
                process.exit(1);
            }

            log('📦 Installing dependencies...');
            try {
                await execa('npm', ['install'], { cwd: projectDir, stdio: 'inherit' });
            } catch (error) {
                log(chalk.red(`❌ Failed to install dependencies: ${error}`));
                process.exit(1);
            }
            
            log('🤖 Generating API client...');
            try {
                await execa('npm', ['run', 'generate-client'], { cwd: projectDir, stdio: 'inherit' });
            } catch (error) {
                log(chalk.red(`❌ Failed to generate API client: ${error}`));
                process.exit(1);
            }

            log(chalk.green('✅ Project created successfully!'));
            log(`To get started:`);
            log(chalk.cyan(`  cd ${argv.name}`));
            log(chalk.cyan(`  npm run dev`));
        }
      )
      .help()
      .argv;
}

main().catch((err) => {
    console.error(chalk.red(err));
    process.exit(1);
}); 
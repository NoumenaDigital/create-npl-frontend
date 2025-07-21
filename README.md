# @noumenadigital/create-npl

Create NPL frontend projects with a single command.

This tool scaffolds a modern React frontend for developing against Noumena Protocol Language (NPL) backends. It generates a project using React, TypeScript, Vite, and other modern web technologies, providing a strong starting point for your NPL-based application.

**Key features:**
- Generates a React project structure
- Includes example code for authentication components that integrate with Keycloak
- Provides templates for protocol list/detail views and API integration

## Installation

```sh
npm install -g @noumenadigital/create-npl
```

## Usage

```sh
npm init @noumenadigital/npl
```

or

```sh
npx @noumenadigital/create-npl
```

### Options

- `--name, -n`  
  The name of the project and directory to create. **(required)**
- `--tenant, -t`  
  The tenant name for your Noumena Cloud environment. **(required)**
- `--app, -a`  
  The application name in Noumena Cloud. **(required)**
- `--package, -p`  
  The NPL package name to use for OpenAPI and client generation. **(required)**
- `--force, -f`  
  Force overwrite of an existing directory if it is not empty. (default: false)

Run with these options to scaffold a new NPL frontend project. For example:

```sh
npm init @noumenadigital/npl -- --name my-app --tenant mytenant --app myapp --package mypackage
```

Follow the interactive prompts (unless using `--auto`) to scaffold a new NPL frontend project.

## Contributing

Contributions are welcome! Please open issues or pull requests on [GitHub](https://github.com/noumenadigital/create-npl-frontend).

const axios = require('axios');
const inquirer = require('inquirer').default;

const fs = require('fs-extra');
const path = require('path');

// GitHub API base URL
const GITHUB_API_BASE_URL = 'https://api.github.com';

/**
 * Fetch repository metadata from GitHub API.
 * @param {string} owner - The owner of the repository.
 * @param {string} repo - The repository name.
 * @returns {Object} - The metadata object.
 */
async function fetchRepoMetadata(owner, repo) {
  try {
    const response = await axios.get(`${GITHUB_API_BASE_URL}/repos/${owner}/${repo}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching repository information: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Generate a `package.json` file based on repository metadata.
 * @param {Object} metadata - The repository metadata object.
 */
function generatePackageJson(metadata) {
  const packageJson = {
    name: metadata.name,
    version: '1.0.0',
    description: metadata.description || '',
    main: 'index.js',
    scripts: {
      test: 'echo "Error: no test specified" && exit 1',
    },
    repository: {
      type: 'git',
      url: metadata.html_url,
    },
    keywords: metadata.topics || [],
    author: metadata.owner.login,
    license: metadata.license ? metadata.license.spdx_id : 'MIT',
    bugs: {
      url: `${metadata.html_url}/issues`,
    },
    homepage: metadata.homepage || metadata.html_url,
  };

  return packageJson;
}

/**
 * Save the generated package.json file to the specified path.
 * @param {string} filePath - The file path where to save the package.json.
 * @param {Object} packageData - The package.json data.
 */
function savePackageJson(filePath, packageData) {
  fs.writeFileSync(filePath, JSON.stringify(packageData, null, 2), 'utf8');
  console.log(`package.json created successfully at: ${filePath}`);
}

/**
 * Main function to create a package from a GitHub repository.
 */
async function main() {
  const { owner, repo, outputDir } = await inquirer.prompt([
    {
      type: 'input',
      name: 'owner',
      message: 'GitHub Repository Owner:',
      validate: (input) => !!input || 'Owner is required',
    },
    {
      type: 'input',
      name: 'repo',
      message: 'GitHub Repository Name:',
      validate: (input) => !!input || 'Repository name is required',
    },
    {
      type: 'input',
      name: 'outputDir',
      message: 'Output Directory (default: ./output):',
      default: './output',
    },
  ]);

  const repoMetadata = await fetchRepoMetadata(owner, repo);

  // Create the output directory if it doesn't exist
  fs.ensureDirSync(outputDir);

  // Generate the package.json content
  const packageJson = generatePackageJson(repoMetadata);

  // Save the package.json file in the specified output directory
  const filePath = path.join(outputDir, 'package.json');
  savePackageJson(filePath, packageJson);

  console.log(`\nRepository metadata for ${owner}/${repo} has been processed successfully.`);
}

main();

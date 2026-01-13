
# SSC Physics Virtual Lab

A high-performance, interactive physics laboratory for secondary school students.

## Features
- **Simulation Engine:** Real-time physics engine using Euler integration.
- **Hierarchical Navigation:** Chapter > Topic > Lab workflow.
- **Bilingual:** Full support for English and Bangla.

## Deployment to GitHub Pages

This project is configured to deploy automatically using GitHub Actions.

### Step 1: Push Code
Upload all files in this folder to a GitHub repository (main branch).

### Step 2: Configure Repository
1. Go to your repository **Settings**.
2. Click **Pages** in the left sidebar.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
   *(Note: Do not select "Deploy from a branch". We are using the custom workflow defined in `.github/workflows/deploy.yml`)*.

### Step 3: Wait & Visit
1. Go to the **Actions** tab in your repository.
2. You will see a workflow named "Deploy to GitHub Pages" running.
3. Once it shows a green checkmark, your site is live! The URL will be shown in the deployment logs (usually `https://yourusername.github.io/repo-name/`).

## Local Development (Optional)
If you want to run this on your own machine:

1. Install Node.js.
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the local server.

# Deploying BioCircuit to Vercel

## Prerequisites
- A GitHub account
- Your code pushed to a GitHub repository
- A Vercel account (free tier works fine)

## Step-by-Step Instructions

### 1. Push Your Code to GitHub

If you haven't already, create a GitHub repository and push your code:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add your GitHub repository as remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/biocircuit.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel Dashboard (Recommended)

1. **Go to Vercel**: Visit [vercel.com](https://vercel.com) and sign in (or create an account using GitHub)

2. **Import Project**: 
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

4. **Environment Variables** (if needed):
   - If you had any environment variables, add them here
   - For this project, no environment variables are needed

5. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (usually 1-2 minutes)

6. **Your App is Live!**:
   - Vercel will provide you with a URL like `biocircuit.vercel.app`
   - You can also add a custom domain if you have one

#### Option B: Using Vercel CLI

1. **Install Vercel CLI**:
```bash
npm i -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
# From your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? biocircuit (or your choice)
# - Directory? ./
# - Override settings? No
```

4. **For Production Deployment**:
```bash
vercel --prod
```

## Important Notes

### Build Settings
Vercel automatically detects Next.js projects, so no special configuration is needed. However, if you need to customize:

- Create a `vercel.json` file in the root (optional):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### Image Optimization
- Make sure your logo file (`public/biocircuit-logo.png`) is included in the repository
- Next.js automatically optimizes images on Vercel

### Environment Variables
- If you add environment variables later, add them in:
  - Vercel Dashboard → Your Project → Settings → Environment Variables
  - Or via CLI: `vercel env add VARIABLE_NAME`

### Custom Domain
1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Ensure all dependencies are in `package.json`
- Make sure Node.js version is compatible (Vercel uses Node 18+ by default)

### Images Not Loading
- Ensure `public/` folder is in your repository
- Check that image paths are correct (should start with `/`)

### 404 Errors
- Next.js App Router should handle routing automatically
- Check that `app/` directory structure is correct

## Continuous Deployment

Once connected to GitHub, Vercel will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Run builds automatically

## Updating Your App

Simply push changes to your GitHub repository:
```bash
git add .
git commit -m "Update description"
git push
```

Vercel will automatically rebuild and deploy!



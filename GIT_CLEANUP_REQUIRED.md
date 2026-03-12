# 🚨 CRITICAL: Git History Cleanup Required

## ⚠️ Security Alert

The `backend/.env` file containing your Gemini API key was previously committed to this repository. **This file has been removed from the working directory**, but it still exists in the git history.

## Required Actions

### 1. Rotate Your API Key (URGENT)

Your exposed API key should be rotated immediately:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Delete** the old API key: `AIzaSyAtCznTmEVWCdGTsBNGy2DWVkk6ktVN-WI`
3. **Generate** a new API key
4. Update your new `backend/.env` file with the new key

### 2. Remove .env from Git History

Choose **ONE** of the following methods:

---

## Method A: Using git filter-repo (Recommended)

This is the cleanest and most efficient method.

### Install git-filter-repo

```bash
# Using pip
pip install git-filter-repo

# Or using brew (macOS)
brew install git-filter-repo
```

### Remove the file from history

```bash
# Navigate to your repository root
cd "F:\Projects\ECM Projects\VisionCopilot-Live\visioncopilot-live"

# Remove backend/.env from all commits
git filter-repo --path backend/.env --invert-paths

# This will rewrite your git history
# WARNING: This changes commit hashes
```

### Force push to remote

```bash
# If you have already pushed to GitHub/remote
git remote add origin https://github.com/moazizbera/visioncopilot-live.git
git push origin --force --all
git push origin --force --tags
```

---

## Method B: Using BFG Repo-Cleaner (Alternative)

If you prefer a GUI-friendly tool:

### Download BFG

Download from: https://rtyley.github.io/bfg-repo-cleaner/

### Run BFG

```bash
# Navigate to parent directory
cd "F:\Projects\ECM Projects\VisionCopilot-Live"

# Run BFG (replace with actual jar path)
java -jar bfg.jar --delete-files .env visioncopilot-live

# Clean up the repository
cd visioncopilot-live
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push
git push origin --force --all
```

---

## Method C: Manual Method (If above tools fail)

### Create a fresh repository

```bash
# Create a new directory
mkdir visioncopilot-live-clean
cd visioncopilot-live-clean

# Initialize new repo
git init

# Copy all files EXCEPT .git folder from old repo
# (Use File Explorer, exclude: .git, backend/.env, node_modules, venv)

# Create initial commit
git add .
git commit -m "Initial commit - cleaned repository"

# Add remote and push
git remote add origin https://github.com/moazizbera/visioncopilot-live.git
git push -u origin main --force
```

---

## 3. Verify Cleanup

After cleaning, verify the .env file is gone:

```bash
# Search entire history for the API key pattern
git log --all --full-history --source --pretty=format:"%H %an %ad" -S "AIzaSy" -- backend/.env

# Should return no results

# Check if file exists in any commit
git log --all --full-history -- backend/.env

# Should return no results
```

---

## 4. Protect Future Commits

The following protections are already in place:

✅ `.env` added to `.gitignore`
✅ `.env.example` provided with placeholder values
✅ Backend validates `GEMINI_API_KEY` at startup
✅ Frontend uses environment variables for URLs
✅ `SECURITY.md` created with detailed guidelines

### Set up pre-commit hook (optional but recommended)

```bash
# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# Prevent committing .env files
if git diff --cached --name-only | grep -E "\.env$"; then
    echo "❌ ERROR: Attempting to commit .env file"
    echo "Please remove .env files from staging area:"
    echo "  git reset HEAD backend/.env"
    exit 1
fi
EOF

# Make it executable
chmod +x .git/hooks/pre-commit
```

---

## 5. Update Team Members

If other developers have cloned this repository:

1. Notify them about the history rewrite
2. Ask them to re-clone the repository:
   ```bash
   cd ..
   rm -rf visioncopilot-live
   git clone https://github.com/moazizbera/visioncopilot-live.git
   cd visioncopilot-live
   ```

---

## Summary Checklist

Before proceeding to hackathon submission:

- [ ] Rotated the exposed API key in Google AI Studio
- [ ] Removed `backend/.env` from git history using one of the methods above
- [ ] Verified cleanup with `git log` commands
- [ ] Force-pushed cleaned history to remote
- [ ] Created new `backend/.env` with the new API key (not committed)
- [ ] Tested that the application works with new key
- [ ] (Optional) Set up pre-commit hook to prevent future mistakes

---

## Need Help?

If you encounter issues:
1. Backup your current repository first
2. Check the detailed guides in [SECURITY.md](SECURITY.md)
3. Consider using Method C (fresh repository) if tools fail

**Remember:** The goal is to ensure no secrets exist in your git history before making the repository public or submitting to the hackathon.

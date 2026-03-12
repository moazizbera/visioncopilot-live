# Security Guidelines for VisionCopilot Live

## 🔐 API Key Management

### Critical Security Requirements

**NEVER commit the following to version control:**
- `.env` files containing real API keys
- Hardcoded API keys in source code
- Secret keys or tokens
- Credentials of any kind

### Proper Configuration

1. **Backend Configuration**
   ```bash
   # Navigate to backend directory
   cd backend
   
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your Gemini API key
   # Get your key from: https://makersuite.google.com/app/apikey
   GEMINI_API_KEY=your_actual_api_key_here
   ```

2. **Frontend Configuration** (optional)
   ```bash
   # Navigate to frontend directory
   cd frontend
   
   # Copy the example file
   cp .env.example .env
   
   # Edit .env if you need custom backend URLs (usually not needed)
   VITE_BACKEND_URL=localhost:8000
   ```

### Environment Variables

#### Backend (.env)
- `GEMINI_API_KEY` - **REQUIRED**: Your Google Gemini API key
- `SESSION_SECRET_KEY` - Secret key for session management (change in production)
- `ENVIRONMENT` - Set to `production` in production environments
- `ALLOWED_ORIGINS` - CORS origins (update for your domain)

#### Frontend (.env) - Optional
- `VITE_BACKEND_URL` - Backend WebSocket URL (defaults to localhost:8000)
- `VITE_API_TARGET` - API proxy target for development

---

## 🚨 If You Accidentally Committed Secrets

If you've committed a `.env` file or API key to git:

### Immediate Actions

1. **Rotate the API key immediately**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Delete the exposed API key
   - Generate a new one

2. **Remove from git history**
   
   **Option A: Using git-filter-repo (Recommended)**
   ```bash
   # Install git-filter-repo
   pip install git-filter-repo
   
   # Remove the file from all history
   git filter-repo --path backend/.env --invert-paths
   
   # Force push (WARNING: This rewrites history)
   git push origin --force --all
   ```
   
   **Option B: Using BFG Repo-Cleaner**
   ```bash
   # Download BFG from: https://rtyley.github.io/bfg-repo-cleaner/
   
   # Remove .env files
   java -jar bfg.jar --delete-files .env
   
   # Clean up
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   
   # Force push
   git push origin --force --all
   ```

3. **Update .gitignore**
   ```bash
   # Ensure .env is ignored
   echo ".env" >> .gitignore
   git add .gitignore
   git commit -m "chore: ensure .env is properly ignored"
   git push
   ```

---

## 🛡️ Security Best Practices

### Development

1. **Use .env.example files**
   - Commit `.env.example` with placeholder values
   - Never commit actual `.env` files

2. **Validate environment variables**
   - The backend validates `GEMINI_API_KEY` at startup
   - Application will not start without required keys

3. **Local testing**
   - Use separate API keys for development and production
   - Consider rate limits during testing

### Production Deployment

1. **Environment Variables**
   - Set `ENVIRONMENT=production` in production
   - Use cloud provider's secret management:
     - Google Cloud: Secret Manager
     - AWS: Systems Manager Parameter Store
     - Azure: Key Vault

2. **CORS Configuration**
   ```bash
   # Update ALLOWED_ORIGINS to your actual domain
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

3. **Session Secret**
   ```bash
   # Generate a strong random key
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   
   # Use it in production
   SESSION_SECRET_KEY=your_generated_secret_here
   ```

4. **API Key Rotation**
   - Rotate API keys periodically
   - Have a plan for emergency rotation
   - Use separate keys per environment

### Code Review Checklist

Before committing:
- [ ] No API keys in code
- [ ] No hardcoded URLs (use environment variables)
- [ ] `.env` files are not staged
- [ ] `.env.example` has placeholder values only
- [ ] All secrets use environment variables
- [ ] No credentials in comments or logs

---

## 🔍 Security Audit

Run these checks before deployment:

```bash
# Check for potential secrets in code
git grep -E "AIzaSy[A-Za-z0-9_-]{33}" -- '*.py' '*.ts' '*.tsx' '*.js'

# Check for hardcoded keys
git grep -E "api_key\s*=\s*[\"']" -- '*.py' '*.ts' '*.tsx' '*.js'

# Verify .env is ignored
git check-ignore backend/.env frontend/.env
```

---

## 📚 Additional Resources

- [Google AI Studio - API Keys](https://makersuite.google.com/app/apikey)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Cloud Run Secret Management](https://cloud.google.com/run/docs/configuring/secrets)

---

## 📞 Reporting Security Issues

If you discover a security vulnerability:
1. **DO NOT** create a public GitHub issue
2. Contact the maintainers privately
3. Provide detailed reproduction steps
4. Allow time for a fix before public disclosure

#!/usr/bin/env python3
"""
VisionCopilot Live - Pre-Submission Verification Script

Comprehensive checks to ensure repository is ready for hackathon submission
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from typing import List, Tuple

# ANSI Colors
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'

class VerificationReport:
    def __init__(self):
        self.passed = []
        self.failed = []
        self.warnings = []
    
    def add_pass(self, check: str):
        self.passed.append(check)
        print(f"{GREEN}\u2713{RESET} {check}")
    
    def add_fail(self, check: str, reason: str = ""):
        self.failed.append((check, reason))
        print(f"{RED}\u2717{RESET} {check}")
        if reason:
            print(f"  {YELLOW}\u2192{RESET} {reason}")
    
    def add_warning(self, check: str, reason: str = ""):
        self.warnings.append((check, reason))
        print(f"{YELLOW}\u26a0{RESET} {check}")
        if reason:
            print(f"  {YELLOW}\u2192{RESET} {reason}")
    
    def print_summary(self):
        total = len(self.passed) + len(self.failed) + len(self.warnings)
        print(f"\n{BOLD}{'='*60}{RESET}")
        print(f"{BOLD}Verification Summary{RESET}")
        print(f"{'='*60}")
        print(f"{GREEN}Passed:{RESET} {len(self.passed)}/{total}")
        print(f"{RED}Failed:{RESET} {len(self.failed)}/{total}")
        print(f"{YELLOW}Warnings:{RESET} {len(self.warnings)}/{total}")
        
        if len(self.failed) == 0:
            print(f"\n{GREEN}{BOLD}\u2713 Repository is READY for submission!{RESET}")
            return 0
        else:
            print(f"\n{RED}{BOLD}\u2717 Repository has {len(self.failed)} critical issues{RESET}")
            print(f"\nFailed checks:")
            for check, reason in self.failed:
                print(f"  {RED}\u2022{RESET} {check}")
                if reason:
                    print(f"    {reason}")
            return 1

def run_command(cmd: List[str], cwd: str = None) -> Tuple[bool, str]:
    """Run shell command and return success status and output"""
    try:
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.returncode == 0, result.stdout + result.stderr
    except Exception as e:
        return False, str(e)

def check_file_exists(report: VerificationReport, filepath: str, description: str):
    """Check if a file exists"""
    if Path(filepath).exists():
        report.add_pass(f"{description} exists")
    else:
        report.add_fail(f"{description} missing", f"Expected: {filepath}")

def check_directory_structure(report: VerificationReport):
    """Verify repository structure"""
    print(f"\n{BLUE}{BOLD}1. Repository Structure{RESET}")
    
    required_dirs = [
        ("backend", "Backend directory"),
        ("frontend", "Frontend directory"),
        ("docs", "Documentation directory"),
        ("ai", "AI integration directory"),
        ("infrastructure", "Infrastructure configs")
    ]
    
    for dir_name, description in required_dirs:
        check_file_exists(report, dir_name, description)

def check_documentation(report: VerificationReport):
    """Verify documentation files"""
    print(f"\n{BLUE}{BOLD}2. Documentation{RESET}")
    
    required_docs = [
        ("README.md", "Main README"),
        ("LICENSE", "License file"),
        ("SECURITY.md", "Security policy"),
        ("CONTRIBUTING.md", "Contributing guide"),
        ("docs/architecture.md", "Architecture documentation"),
        ("docs/QUICKSTART.md", "Quick start guide"),
        ("docs/DEPLOYMENT.md", "Deployment guide"),
        ("docs/TROUBLESHOOTING.md", "Troubleshooting guide"),
        ("docs/COMPONENTS.md", "Component documentation")
    ]
    
    for filepath, description in required_docs:
        check_file_exists(report, filepath, description)

def check_configuration_files(report: VerificationReport):
    """Verify configuration files"""
    print(f"\n{BLUE}{BOLD}3. Configuration Files{RESET}")
    
    # Check for .env.example but not .env
    if Path("backend/.env.example").exists():
        report.add_pass("Backend .env.example exists")
    else:
        report.add_fail("Backend .env.example missing")
    
    if Path("frontend/.env.example").exists():
        report.add_pass("Frontend .env.example exists")
    else:
        report.add_warning("Frontend .env.example missing", "Optional but recommended")
    
    if Path("backend/.env").exists():
        report.add_fail(".env file committed", "Remove backend/.env from git")
    else:
        report.add_pass("No .env files committed")
    
    # Check .gitignore
    if Path(".gitignore").exists():
        with open(".gitignore") as f:
            content = f.read()
            if ".env" in content:
                report.add_pass(".gitignore includes .env")
            else:
                report.add_fail(".gitignore missing .env pattern")
    else:
        report.add_fail(".gitignore missing")

def check_backend(report: VerificationReport):
    """Verify backend setup"""
    print(f"\n{BLUE}{BOLD}4. Backend Verification{RESET}")
    
    # Check requirements.txt
    if Path("backend/requirements.txt").exists():
        report.add_pass("requirements.txt exists")
        
        with open("backend/requirements.txt") as f:
            content = f.read()
            required_packages = ["fastapi", "uvicorn", "pydantic", "google-generativeai"]
            for pkg in required_packages:
                if pkg in content:
                    report.add_pass(f"  {pkg} in requirements.txt")
                else:
                    report.add_fail(f"  {pkg} missing from requirements.txt")
    else:
        report.add_fail("requirements.txt missing")
    
    # Check main.py
    if Path("backend/app/main.py").exists():
        report.add_pass("main.py exists")
        
        with open("backend/app/main.py") as f:
            content = f.read()
            if "GEMINI_API_KEY" in content:
                report.add_pass("  API key validation present")
            if "lifespan" in content:
                report.add_pass("  Lifespan manager configured")
    else:
        report.add_fail("main.py missing")

def check_frontend(report: VerificationReport):
    """Verify frontend setup"""
    print(f"\n{BLUE}{BOLD}5. Frontend Verification{RESET}")
    
    # Check package.json
    if Path("frontend/package.json").exists():
        report.add_pass("package.json exists")
        
        try:
            with open("frontend/package.json") as f:
                pkg = json.load(f)
                
                required_deps = ["react", "react-dom"]
                deps = pkg.get("dependencies", {})
                for dep in required_deps:
                    if dep in deps:
                        report.add_pass(f"  {dep} in dependencies")
                    else:
                        report.add_fail(f"  {dep} missing from dependencies")
                
                required_scripts = ["dev", "build"]
                scripts = pkg.get("scripts", {})
                for script in required_scripts:
                    if script in scripts:
                        report.add_pass(f"  '{script}' script defined")
                    else:
                        report.add_fail(f"  '{script}' script missing")
        except json.JSONDecodeError:
            report.add_fail("  package.json invalid JSON")
    else:
        report.add_fail("package.json missing")
    
    # Check src directory
    check_file_exists(report, "frontend/src/App.tsx", "  App.tsx component")
    check_file_exists(report, "frontend/src/main.tsx", "  main.tsx entry point")

def check_security(report: VerificationReport):
    """Security checks"""
    print(f"\n{BLUE}{BOLD}6. Security Verification{RESET}")
    
    # Check for committed secrets
    success, output = run_command(["git", "log", "--all", "--", "backend/.env"])
    if success and len(output.strip()) == 0:
        report.add_pass("No .env in git history")
    else:
        report.add_fail(".env found in git history", "Run git filter-branch to remove")
    
    # Check for API keys in code
    success, output = run_command(
        ["git", "grep", "-i", "-E", "AIzaSy|api_key.*=.*['\"][^'\"]+['\"]"]
    )
    if not success or len(output.strip()) == 0:
        report.add_pass("No hardcoded API keys found")
    else:
        report.add_warning("Potential API key in code", "Review git grep results")

def check_demo_resources(report: VerificationReport):
    """Check demo videos and screenshots"""
    print(f"\n{BLUE}{BOLD}7. Demo Resources{RESET}")
    
    demo_files = [
        ("docs/voice.jpeg", "Voice demo screenshot"),
        ("docs/screen.jpeg", "Screen demo screenshot"),
        ("docs/response.jpeg", "Response demo screenshot"),
        ("docs/demo_thumbnail_main.png", "Main demo thumbnail"),
        ("docs/demo_thumbnail_extended.png", "Extended demo thumbnail")
    ]
    
    for filepath, description in demo_files:
        check_file_exists(report, filepath, description)
    
    # Check README for YouTube links
    if Path("README.md").exists():
        with open("README.md") as f:
            content = f.read()
            if "youtu.be" in content or "youtube.com" in content:
                report.add_pass("YouTube demo links in README")
            else:
                report.add_warning("No YouTube links in README", "Consider adding demo videos")

def check_git_status(report: VerificationReport):
    """Check git repository status"""
    print(f"\n{BLUE}{BOLD}8. Git Repository{RESET}")
    
    # Check for uncommitted changes
    success, output = run_command(["git", "status", "--porcelain"])
    if success:
        if len(output.strip()) == 0:
            report.add_pass("No uncommitted changes")
        else:
            report.add_warning("Uncommitted changes exist", "Commit or stash before submission")
    
    # Check remote
    success, output = run_command(["git", "remote", "-v"])
    if success and "github.com" in output:
        report.add_pass("GitHub remote configured")
    else:
        report.add_fail("GitHub remote not configured")

def check_readme_quality(report: VerificationReport):
    """Check README quality"""
    print(f"\n{BLUE}{BOLD}9. README Quality{RESET}")
    
    if not Path("README.md").exists():
        report.add_fail("README.md missing")
        return
    
    with open("README.md") as f:
        content = f.read()
        
        required_sections = [
            ("# ", "Has title"),
            ("## ", "Has sections"),
            ("Quick Start", "Has quick start"),
            ("Demo", "Has demo section"),
            ("Architecture", "Has architecture section"),
            ("License", "Has license section")
        ]
        
        for pattern, description in required_sections:
            if pattern in content:
                report.add_pass(f"  {description}")
            else:
                report.add_fail(f"  {description} missing")
        
        # Check for badges
        if "badge" in content.lower() or "shields.io" in content:
            report.add_pass("  Has badges")
        else:
            report.add_warning("  No badges", "Consider adding status badges")
        
        # Check length
        word_count = len(content.split())
        if word_count > 500:
            report.add_pass(f"  Comprehensive ({word_count} words)")
        else:
            report.add_warning(f"  Brief ({word_count} words)", "Consider expanding")

def check_build_readiness(report: VerificationReport):
    """Check if project can build"""
    print(f"\n{BLUE}{BOLD}10. Build Readiness{RESET}")
    
    # Check if dist exists (frontend built)
    if Path("frontend/dist").exists():
        report.add_pass("Frontend dist/ exists (built)")
    else:
        report.add_warning("Frontend not built", "Run 'npm run build' before deployment")
    
    # Check if node_modules exists
    if Path("frontend/node_modules").exists():
        report.add_pass("Frontend dependencies installed")
    else:
        report.add_warning("Frontend dependencies not installed", "Run 'npm install'")

def main():
    print(f"{BOLD}{BLUE}")
    print("="*60)
    print("  VisionCopilot Live - Submission Verification")
    print("  Gemini Live Agent Challenge")
    print("="*60)
    print(f"{RESET}\n")
    
    # Change to repository root
    repo_root = Path(__file__).parent.parent
    os.chdir(repo_root)
    
    report = VerificationReport()
    
    # Run all checks
    check_directory_structure(report)
    check_documentation(report)
    check_configuration_files(report)
    check_backend(report)
    check_frontend(report)
    check_security(report)
    check_demo_resources(report)
    check_git_status(report)
    check_readme_quality(report)
    check_build_readiness(report)
    
    # Print summary
    exit_code = report.print_summary()
    
    if exit_code == 0:
        print(f"\n{GREEN}{BOLD}Next Steps:{RESET}")
        print(f"  1. Commit any remaining changes")
        print(f"  2. Push to GitHub")
        print(f"  3. Submit to Gemini Live Agent Challenge")
        print(f"  4. Good luck!\n")
    else:
        print(f"\n{RED}{BOLD}Action Required:{RESET}")
        print(f"  Fix the issues above before submitting")
        print(f"  See docs/TROUBLESHOOTING.md for help\n")
    
    sys.exit(exit_code)

if __name__ == "__main__":
    main()

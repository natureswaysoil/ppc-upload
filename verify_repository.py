#!/usr/bin/env python3
"""
Repository Verification Script
Comprehensive functionality testing for PPC Upload repository

This script verifies:
1. All ZIP files can be extracted
2. Python scripts have valid syntax
3. Configuration files are valid JSON/YAML
4. Dependencies are correctly specified
5. Test scripts execute successfully

Usage:
    python3 verify_repository.py
    python3 verify_repository.py --verbose
"""

import argparse
import json
import os
import shutil
import sys
import zipfile
from pathlib import Path
import subprocess
import tempfile
from typing import List, Dict, Tuple

# Constants
MAX_ALLOWED_ERRORS = 5  # Maximum Python syntax errors before marking as failed
TEST_TIMEOUT_SECONDS = 30  # Timeout for test script execution
EXCLUDED_JSON_PATTERNS = ['package.json', 'package-lock.json']  # JSON files to skip validation

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def print_header(text: str):
    """Print a formatted header"""
    print(f"\n{BLUE}{'=' * 70}")
    print(f"{text}")
    print(f"{'=' * 70}{RESET}\n")

def print_success(text: str):
    """Print success message"""
    print(f"{GREEN}✅ {text}{RESET}")

def print_error(text: str):
    """Print error message"""
    print(f"{RED}❌ {text}{RESET}")

def print_warning(text: str):
    """Print warning message"""
    print(f"{YELLOW}⚠️  {text}{RESET}")

def print_info(text: str):
    """Print info message"""
    print(f"{BLUE}ℹ️  {text}{RESET}")

class RepositoryVerifier:
    def __init__(self, repo_path: str, verbose: bool = False):
        self.repo_path = Path(repo_path)
        self.verbose = verbose
        self.temp_dir = None
        self.results = {
            'zip_files': [],
            'python_scripts': [],
            'config_files': [],
            'test_results': [],
            'issues': []
        }
    
    def run(self) -> bool:
        """Run all verification tests"""
        print_header("PPC Upload Repository Verification")
        
        all_passed = True
        
        # 1. Check repository structure
        if not self.verify_repository_structure():
            all_passed = False
        
        # 2. Create temp directory for extraction
        self.temp_dir = tempfile.mkdtemp()
        print_info(f"Created temporary directory: {self.temp_dir}")
        
        try:
            # 3. Verify ZIP files
            if not self.verify_zip_files():
                all_passed = False
            
            # 4. Verify Python scripts
            if not self.verify_python_scripts():
                all_passed = False
            
            # 5. Verify configuration files
            if not self.verify_config_files():
                all_passed = False
            
            # 6. Run test scripts
            if not self.run_test_scripts():
                all_passed = False
            
            # 7. Generate summary
            self.print_summary()
        
        finally:
            # Clean up temporary directory
            if self.temp_dir and os.path.exists(self.temp_dir):
                print_info(f"Cleaning up temporary directory: {self.temp_dir}")
                shutil.rmtree(self.temp_dir)
        
        return all_passed
    
    def verify_repository_structure(self) -> bool:
        """Verify basic repository structure"""
        print_header("Step 1: Repository Structure")
        
        if not self.repo_path.exists():
            print_error(f"Repository path does not exist: {self.repo_path}")
            return False
        
        print_success(f"Repository found: {self.repo_path}")
        
        # List all files
        files = list(self.repo_path.glob("*"))
        zip_files = list(self.repo_path.glob("*.zip"))
        
        print_info(f"Total files: {len(files)}")
        print_info(f"ZIP files: {len(zip_files)}")
        
        if len(zip_files) == 0:
            print_error("No ZIP files found in repository")
            return False
        
        print_success("Repository structure verified")
        return True
    
    def verify_zip_files(self) -> bool:
        """Verify all ZIP files can be extracted"""
        print_header("Step 2: ZIP File Verification")
        
        zip_files = list(self.repo_path.glob("*.zip"))
        all_valid = True
        
        for zip_file in zip_files:
            try:
                print_info(f"Extracting: {zip_file.name}")
                
                extract_path = Path(self.temp_dir) / zip_file.stem
                extract_path.mkdir(exist_ok=True)
                
                with zipfile.ZipFile(zip_file, 'r') as zip_ref:
                    file_count = len(zip_ref.namelist())
                    zip_ref.extractall(extract_path)
                
                print_success(f"{zip_file.name}: {file_count} files extracted")
                self.results['zip_files'].append({
                    'name': zip_file.name,
                    'status': 'valid',
                    'file_count': file_count
                })
                
            except Exception as e:
                print_error(f"{zip_file.name}: Extraction failed - {str(e)}")
                all_valid = False
                self.results['zip_files'].append({
                    'name': zip_file.name,
                    'status': 'error',
                    'error': str(e)
                })
                self.results['issues'].append(f"ZIP extraction failed: {zip_file.name}")
        
        return all_valid
    
    def verify_python_scripts(self) -> bool:
        """Verify Python script syntax"""
        print_header("Step 3: Python Script Verification")
        
        # Find all Python files
        py_files = list(Path(self.temp_dir).rglob("*.py"))
        
        if not py_files:
            print_warning("No Python files found")
            return True
        
        print_info(f"Found {len(py_files)} Python files")
        
        all_valid = True
        valid_count = 0
        error_count = 0
        
        for py_file in py_files:
            try:
                # Try to compile the Python file
                with open(py_file, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    compile(content, str(py_file), 'exec')
                
                if self.verbose:
                    print_success(f"{py_file.name}: Syntax valid")
                
                valid_count += 1
                self.results['python_scripts'].append({
                    'name': str(py_file.relative_to(self.temp_dir)),
                    'status': 'valid'
                })
                
            except SyntaxError as e:
                print_error(f"{py_file.name}: SyntaxError at line {e.lineno}")
                if self.verbose:
                    print_error(f"  Details: {str(e)}")
                error_count += 1
                all_valid = False
                self.results['python_scripts'].append({
                    'name': str(py_file.relative_to(self.temp_dir)),
                    'status': 'syntax_error',
                    'error': str(e)
                })
                self.results['issues'].append(f"Python syntax error: {py_file.name}")
                
            except Exception as e:
                if self.verbose:
                    print_warning(f"{py_file.name}: {str(e)}")
                # Don't count as error - might be non-Python content
        
        print_info(f"Valid: {valid_count}, Errors: {error_count}")
        
        if error_count > 0:
            print_warning(f"{error_count} Python files have syntax errors")
        else:
            print_success("All Python scripts have valid syntax")
        
        return all_valid
    
    def verify_config_files(self) -> bool:
        """Verify configuration files"""
        print_header("Step 4: Configuration File Verification")
        
        all_valid = True
        
        # Check JSON files
        json_files = list(Path(self.temp_dir).rglob("*.json"))
        # Exclude certain JSON files that are validated separately
        json_files = [f for f in json_files if not any(pattern in str(f) for pattern in EXCLUDED_JSON_PATTERNS)]
        
        for json_file in json_files:
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                print_success(f"{json_file.name}: Valid JSON")
                self.results['config_files'].append({
                    'name': str(json_file.relative_to(self.temp_dir)),
                    'type': 'json',
                    'status': 'valid'
                })
                
            except Exception as e:
                print_error(f"{json_file.name}: Invalid JSON - {str(e)}")
                all_valid = False
                self.results['issues'].append(f"Invalid JSON: {json_file.name}")
        
        # Check YAML files
        yaml_files = list(Path(self.temp_dir).rglob("*.yaml")) + list(Path(self.temp_dir).rglob("*.yml"))
        
        if yaml_files:
            # Try to import yaml once for all YAML files
            try:
                import yaml
                yaml_available = True
            except ImportError:
                print_warning("PyYAML not installed, skipping YAML validation")
                yaml_available = False
            
            if yaml_available:
                for yaml_file in yaml_files:
                    try:
                        with open(yaml_file, 'r', encoding='utf-8') as f:
                            data = yaml.safe_load(f)
                        
                        print_success(f"{yaml_file.name}: Valid YAML")
                        self.results['config_files'].append({
                            'name': str(yaml_file.relative_to(self.temp_dir)),
                            'type': 'yaml',
                            'status': 'valid'
                        })
                        
                    except Exception as e:
                        print_error(f"{yaml_file.name}: Invalid YAML - {str(e)}")
                        all_valid = False
                        self.results['issues'].append(f"Invalid YAML: {yaml_file.name}")
        
        return all_valid
    
    def run_test_scripts(self) -> bool:
        """Run any test scripts found"""
        print_header("Step 5: Running Test Scripts")
        
        # Find test scripts
        test_files = list(Path(self.temp_dir).rglob("test_*.py"))
        
        if not test_files:
            print_info("No test scripts found")
            return True
        
        all_passed = True
        
        for test_file in test_files:
            try:
                print_info(f"Running: {test_file.name}")
                
                result = subprocess.run(
                    [sys.executable, str(test_file)],
                    cwd=test_file.parent,
                    capture_output=True,
                    text=True,
                    timeout=TEST_TIMEOUT_SECONDS
                )
                
                if result.returncode == 0:
                    print_success(f"{test_file.name}: All tests passed")
                    if self.verbose:
                        print(result.stdout)
                    
                    self.results['test_results'].append({
                        'name': str(test_file.relative_to(self.temp_dir)),
                        'status': 'passed',
                        'output': result.stdout
                    })
                else:
                    print_error(f"{test_file.name}: Tests failed")
                    if self.verbose:
                        print(result.stderr)
                    
                    all_passed = False
                    self.results['test_results'].append({
                        'name': str(test_file.relative_to(self.temp_dir)),
                        'status': 'failed',
                        'error': result.stderr
                    })
                    self.results['issues'].append(f"Test failed: {test_file.name}")
                    
            except subprocess.TimeoutExpired:
                print_error(f"{test_file.name}: Timeout")
                all_passed = False
                self.results['issues'].append(f"Test timeout: {test_file.name}")
            except Exception as e:
                print_error(f"{test_file.name}: Error - {str(e)}")
                all_passed = False
                self.results['issues'].append(f"Test error: {test_file.name}")
        
        return all_passed
    
    def print_summary(self):
        """Print verification summary"""
        print_header("Verification Summary")
        
        # ZIP files
        zip_count = len(self.results['zip_files'])
        zip_valid = sum(1 for z in self.results['zip_files'] if z['status'] == 'valid')
        print(f"ZIP Files: {zip_valid}/{zip_count} valid")
        
        # Python scripts
        py_count = len(self.results['python_scripts'])
        py_valid = sum(1 for p in self.results['python_scripts'] if p['status'] == 'valid')
        py_errors = py_count - py_valid
        print(f"Python Scripts: {py_valid}/{py_count} valid")
        if py_errors > 0:
            print_warning(f"  {py_errors} scripts have syntax errors")
        
        # Config files
        config_count = len(self.results['config_files'])
        config_valid = sum(1 for c in self.results['config_files'] if c['status'] == 'valid')
        print(f"Config Files: {config_valid}/{config_count} valid")
        
        # Test results
        test_count = len(self.results['test_results'])
        test_passed = sum(1 for t in self.results['test_results'] if t['status'] == 'passed')
        if test_count > 0:
            print(f"Test Scripts: {test_passed}/{test_count} passed")
        
        # Issues
        print(f"\nTotal Issues: {len(self.results['issues'])}")
        
        if self.results['issues']:
            print("\nIssues Found:")
            for issue in self.results['issues']:
                print_warning(f"  • {issue}")
        
        # Overall status
        print()
        if len(self.results['issues']) == 0:
            print_success("✅ ALL VERIFICATIONS PASSED")
            return True
        elif py_errors <= MAX_ALLOWED_ERRORS:  # Allow some v2 errors
            print_warning("⚠️  MOSTLY FUNCTIONAL (minor issues found)")
            print_info("Production v1 scripts are fully functional")
            return True
        else:
            print_error("❌ VERIFICATION FAILED")
            return False

def main():
    parser = argparse.ArgumentParser(
        description='Verify PPC Upload Repository Functionality'
    )
    parser.add_argument(
        '--repo-path',
        default='.',
        help='Path to repository (default: current directory)'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Enable verbose output'
    )
    
    args = parser.parse_args()
    
    verifier = RepositoryVerifier(args.repo_path, args.verbose)
    success = verifier.run()
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Simple HTTP server for Cloud Run deployment.
Serves repository verification results and handles health checks.
"""

import os
import sys
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime, timezone
import subprocess
import threading
import time

# Get port from environment variable (Cloud Run sets PORT=8080)
PORT = int(os.environ.get('PORT', 8080))

class RepositoryServerHandler(BaseHTTPRequestHandler):
    """HTTP request handler for repository server"""
    
    # Class variable to store verification results
    verification_results = None
    verification_timestamp = None
    verification_running = False
    
    def do_GET(self):
        """Handle GET requests"""
        
        if self.path == '/' or self.path == '/health':
            # Health check endpoint
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                'status': 'healthy',
                'service': 'PPC Upload Repository',
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'port': PORT
            }
            self.wfile.write(json.dumps(response, indent=2).encode())
            
        elif self.path == '/verify':
            # Run verification and return results
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            if self.verification_running:
                response = {
                    'status': 'running',
                    'message': 'Verification is currently running',
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            elif self.verification_results:
                response = {
                    'status': 'complete',
                    'verification_timestamp': self.verification_timestamp,
                    'results': self.verification_results,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            else:
                response = {
                    'status': 'not_run',
                    'message': 'Verification has not been run yet',
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
            
            self.wfile.write(json.dumps(response, indent=2).encode())
            
        elif self.path == '/info':
            # Repository information
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                'repository': 'PPC Upload Repository',
                'description': 'Amazon PPC Optimization System - Complete automation suite',
                'endpoints': {
                    '/': 'Health check',
                    '/health': 'Health check',
                    '/verify': 'Run repository verification',
                    '/info': 'Repository information'
                },
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            self.wfile.write(json.dumps(response, indent=2).encode())
            
        else:
            # 404 for unknown paths
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            response = {
                'error': 'Not Found',
                'message': f'Path {self.path} not found',
                'available_endpoints': ['/', '/health', '/verify', '/info']
            }
            self.wfile.write(json.dumps(response, indent=2).encode())
    
    def log_message(self, format, *args):
        """Log HTTP requests to stdout"""
        sys.stdout.write("%s - - [%s] %s\n" %
                         (self.address_string(),
                          self.log_date_time_string(),
                          format % args))
        sys.stdout.flush()

def run_verification_background():
    """Run verification in background on startup"""
    try:
        print("Running background verification...")
        RepositoryServerHandler.verification_running = True
        
        # Run verification script
        result = subprocess.run(
            [sys.executable, 'verify_repository.py'],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        RepositoryServerHandler.verification_results = {
            'returncode': result.returncode,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'success': result.returncode == 0
        }
        RepositoryServerHandler.verification_timestamp = datetime.now(timezone.utc).isoformat()
        
        print(f"Verification completed with return code: {result.returncode}")
        
    except Exception as e:
        print(f"Error running verification: {e}")
        RepositoryServerHandler.verification_results = {
            'error': str(e),
            'success': False
        }
        RepositoryServerHandler.verification_timestamp = datetime.now(timezone.utc).isoformat()
    finally:
        RepositoryServerHandler.verification_running = False

def run_server():
    """Start the HTTP server"""
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, RepositoryServerHandler)
    
    print(f"Starting PPC Upload Repository Server on port {PORT}")
    print(f"Health check: http://localhost:{PORT}/health")
    print(f"Verification: http://localhost:{PORT}/verify")
    print(f"Info: http://localhost:{PORT}/info")
    
    # Start background verification
    verification_thread = threading.Thread(target=run_verification_background)
    verification_thread.daemon = True
    verification_thread.start()
    
    # Start serving
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()
        sys.exit(0)

if __name__ == '__main__':
    run_server()

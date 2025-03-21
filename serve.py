import http.server
import socketserver
import os

PORT = 8000

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        http.server.SimpleHTTPRequestHandler.end_headers(self)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type")
        self.end_headers()

Handler = CORSHTTPRequestHandler

print(f"Starting server on port {PORT}...")
print(f"Open http://localhost:{PORT} in your browser")
print("Press Ctrl+C to stop the server")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()

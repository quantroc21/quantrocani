"""Minimal quiet HTTP server bound to 127.0.0.1 on an ephemeral port."""
import functools
import http.server
import os
import sys

web_dir = sys.argv[1]
port_file = sys.argv[2]

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

handler = functools.partial(QuietHandler, directory=web_dir)
httpd = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
port = httpd.server_address[1]
with open(port_file, 'w') as f:
    f.write(str(port))
httpd.serve_forever()

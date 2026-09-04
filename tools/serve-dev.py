#!/usr/bin/env python3
"""Dev static server with Cache-Control: no-store so live previews never serve
stale bytes (python http.server only sends Last-Modified -> heuristic cache).
Usage: python3 tools/serve-dev.py <port> <directory>"""
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial

class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

port = int(sys.argv[1]); directory = sys.argv[2]
ThreadingHTTPServer(("0.0.0.0", port), partial(NoCache, directory=directory)).serve_forever()

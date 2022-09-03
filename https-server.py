from http.server import HTTPServer, SimpleHTTPRequestHandler
import ssl, os, sys
from pathlib import Path

#
# Based on https://gist.github.com/dergachev/7028596?permalink_comment_id=3720350#gistcomment-3720350
#


if len(sys.argv) < 2:
    print(f'usage: {sys.argv[0]} <path-where-game-is>')
    exit(1)

path = sys.argv[1]

os.chdir(path)

cert_fname = 'key.pem'
if not Path(cert_fname).exists():
    os.system(f"openssl req -nodes -x509 -newkey rsa:4096 -keyout {cert_fname} -out cert.pem -days 365 -subj '/CN=mylocalhost'")

port = 4443
httpd = HTTPServer(('0.0.0.0', port), SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket(httpd.socket, keyfile='key.pem', certfile="cert.pem", server_side=True)
print(f"Server running on https://0.0.0.0:{port}")
httpd.serve_forever()

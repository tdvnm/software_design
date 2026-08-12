import os

from app import create_server
from database import open_database

db = open_database()
server = create_server(db, port=int(os.environ.get("PORT", "3000")))
print(f"Tracey: http://127.0.0.1:{server.server_address[1]}")
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
    db.close()

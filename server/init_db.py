from database import open_database

db = open_database()
print("SQLite schema ready. Use npm run db:import to load the course CSV.")
db.close()

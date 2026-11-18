from app.services.seed import seed_database

if __name__ == "__main__":
    seed_database()
    print("Seeded demo data. Login with ops@example.com / demo123")

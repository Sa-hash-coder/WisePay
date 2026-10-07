"""
DEPRECATED: Legacy prototype in-memory seed script.

This logic has been completely replaced by the deterministic CLI seeder:
backend/scripts/seed_demo_data.py

Usage:
    python backend/scripts/seed_demo_data.py --count 100 --reset
"""

if __name__ == "__main__":
    print(
        "Notice: backend/data/seed.py is deprecated. "
        "Please use 'python backend/scripts/seed_demo_data.py --count 100' instead."
    )

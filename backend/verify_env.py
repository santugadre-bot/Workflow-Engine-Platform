import psycopg2
from psycopg2.extras import RealDictCursor
import sys

conn_info = "host=localhost dbname=workflow_engine user=postgres password=santu@8496"

def verify_db():
    try:
        conn = psycopg2.connect(conn_info)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        print("Checking tables...")
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        tables = [t['table_name'] for t in cur.fetchall()]
        print(f"Found {len(tables)} tables: {', '.join(tables)}")
        
        counts = {}
        for table in tables:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            counts[table] = cur.fetchone()['count']
        
        print("\nRow Counts:")
        for table, count in counts.items():
            print(f"  {table}: {count}")
            
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"DB Error: {e}")
        return False

if __name__ == "__main__":
    if verify_db():
        sys.exit(0)
    else:
        sys.exit(1)

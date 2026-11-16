import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

def check_connection():
    print("Attempting to connect to the database directly...")
    try:
        connection = pymysql.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            cursor.execute("SELECT VERSION();")
            result = cursor.fetchone()
            print(f"✅ SUCCESS! Connected to MySQL version: {result['VERSION()']}")
            
        connection.close()
    except Exception as e:
        print(f"❌ FAILED to connect. Error: {e}")

if __name__ == "__main__":
    check_connection()
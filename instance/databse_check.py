import sqlite3
from tabulate import tabulate  # pip install tabulate if you don't have it

def main():
    # Connect to the database in the current directory
    conn = sqlite3.connect('mibase.db')
    cursor = conn.cursor()

    # Query user table for id, email, and password
    cursor.execute("SELECT id, email, password FROM user")
    rows = cursor.fetchall()

    # Define headers for table output
    headers = ["ID", "Email", "Password (hashed)"]

    # Print table using tabulate (pretty formatting)
    print(tabulate(rows, headers=headers, tablefmt="github"))

    # Close connection
    conn.close()

if __name__ == "__main__":
    main()


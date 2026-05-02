import pandas as pd
import sqlite3 # Simulating DB connection
import os

def collect():
    print("Collecting data from Forum database...")
    
    # In a real scenario, we would use a real DB connector
    # Here we just show the logic
    new_data = [
        {"text": "Superbe expérience au Cap Bon !", "label": 0},
        {"text": "Promotion exceptionnelle sur les montres GPS", "label": 1}
    ]
    
    df = pd.DataFrame(new_data)
    
    if os.path.exists('dataset.csv'):
        df.to_csv('dataset.csv', mode='a', header=False, index=False)
        print("Data appended to dataset.csv")
    else:
        df.to_csv('dataset.csv', index=False)
        print("dataset.csv created")

if __name__ == "__main__":
    collect()

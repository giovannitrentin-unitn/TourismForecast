import pandas as pd

def aggiungi_totali(df: pd.DataFrame):
    
    """
    Aggiunge la colonna 'Totale' solo se le colonne fornite 
    sono esattamente ['Italiani', 'Stranieri'].
    """
    colonne_da_sommare = ["Italiani", "Stranieri"]

    # Verifichiamo che le colonne esistano effettivamente nel DataFrame
    if set(colonne_da_sommare).issubset(df.columns):
        # Eseguiamo la somma riga per riga
        df['Totale'] = df[colonne_da_sommare].fillna(0).sum(axis=1)
        print("Colonna 'Totale' aggiunta con successo.")
    else:
        print("Errore: Le colonne 'Italiani' e 'Stranieri' non sono presenti nel CSV.")
    
    return df
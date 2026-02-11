import pandas as pd
import os

def carica_dati(input_file="app/data/dati.csv"):
    # --------------------------------------------------
    # 1. Controllo esistenza file
    # --------------------------------------------------
    if not os.path.exists(input_file):
        raise FileNotFoundError(f"Il file non esiste nel percorso: {input_file}")

    # --------------------------------------------------
    # 2. Caricamento dati (ROBUSTO)
    # --------------------------------------------------
    try:
        # sep=None con engine='python' dice a Pandas di indovinare se usare , o ;
        df = pd.read_csv(input_file, sep=None, engine='python')
        
        # 3. Pulizia nomi colonne
        # Rimuove spazi vuoti all'inizio/fine (es. " Periodo " -> "Periodo")
        df.columns = df.columns.str.strip()
        
        # 4. Controllo Case-Insensitive (Maiuscole/Minuscole)
        # Se nel CSV è scritto "periodo" minuscolo, lo rinominiamo in "Periodo"
        df.rename(columns=lambda x: x.capitalize(), inplace=True)

        # DEBUG: Se ancora non trova la colonna, stampa cosa ha trovato
        if "Periodo" not in df.columns:
            raise KeyError(f"Colonna 'Periodo' non trovata. Colonne presenti: {df.columns.tolist()}")

        # 5. Conversione Data
        # errors='coerce' trasforma i valori non leggibili in NaT invece di rompere tutto
        df["Periodo"] = pd.to_datetime(df["Periodo"], errors='coerce')
        
        # Rimuoviamo righe dove la data non è valida (opzionale ma consigliato)
        df = df.dropna(subset=['Periodo'])

        return df

    except Exception as e:
        print(f"Errore critico durante il caricamento di {input_file}: {e}")
        raise e
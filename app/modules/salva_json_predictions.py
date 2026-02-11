import json
import os

def salva_json(dati, output_path="output.json"):
    """
    Salva un dizionario o una lista in un file JSON.
    Crea automaticamente la cartella di destinazione se non esiste.
    """
    try:
        # 1. Se il percorso include una cartella, assicuriamoci che esista
        cartella = os.path.dirname(output_path)
        if cartella:
            os.makedirs(cartella, exist_ok=True)

        # 2. Scrittura del file
        # 'utf-8' è fondamentale per caratteri speciali
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(
                dati, 
                f, 
                indent=4,            # Rende il JSON leggibile (pretty print)
                ensure_ascii=False   # Mantiene i caratteri speciali (es. "Città" invece di "Citt\u00e0")
            )
            
        print(f"✅ File salvato con successo in: {output_path}")

    except Exception as e:
        print(f"❌ Errore durante il salvataggio del file: {e}")

def carica_json(input_path):
    """
    Carica un file JSON dal percorso specificato.
    Restituisce:
      - I dati (dict o list) se il caricamento ha successo.
      - None se c'è un errore (file non trovato o JSON non valido).
    """
    # 1. Controllo esistenza file
    if not os.path.exists(input_path):
        print(f"⚠️ Attenzione: Il file '{input_path}' non esiste.")
        return None

    try:
        # 2. Lettura del file
        # 'utf-8' è fondamentale per non rompere caratteri come à, è, ò
        with open(input_path, 'r', encoding='utf-8') as f:
            dati = json.load(f)
            
        print(f"✅ File '{input_path}' caricato correttamente.")
        return dati

    except json.JSONDecodeError as e:
        # Questo errore scatta se il file c'è ma è scritto male (es. manca una virgola)
        print(f"❌ Errore: Il file '{input_path}' non è un JSON valido.")
        print(f"   Dettaglio errore: {e}")
        return None

    except Exception as e:
        # Qualsiasi altro errore (es. permessi negati)
        print(f"❌ Errore generico durante il caricamento: {e}")
        return None
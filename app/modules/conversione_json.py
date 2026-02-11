import json
import pandas as pd
from collections import defaultdict

def conversione_json(df: pd.DataFrame):
    """
    Converte un DataFrame pandas in un JSON annidato.
    Le date della colonna 'Periodo' vengono formattate in 'YYYY-MM'.
    """
    provenienze_target = ["Italiani", "Stranieri"]
    colonne_presenti = [c for c in provenienze_target if c in df.columns]

    dati = defaultdict(lambda: defaultdict(list))

    for _, row in df.iterrows():
        metrica = str(row["Metrica"])

        # Formattiamo 'Periodo' in anno-mese
        periodo = row["Periodo"]
        if isinstance(periodo, pd.Timestamp):
            periodo_str = periodo.strftime("%Y-%m")
        else:
            # Proviamo a convertire in datetime se non è già Timestamp
            try:
                periodo_dt = pd.to_datetime(periodo)
                periodo_str = periodo_dt.strftime("%Y-%m")
            except Exception:
                periodo_str = str(periodo)  # fallback, se non si riesce a convertire

        record = {"ambito": str(row["Ambito"])}

        for col in colonne_presenti:
            value = row[col]
            record[col.lower()] = int(value) if pd.notna(value) else None

        dati[metrica][periodo_str].append(record)

    # Convertiamo defaultdict annidato in dict normale per JSON
    return {metrica: dict(periodi) for metrica, periodi in dati.items()}



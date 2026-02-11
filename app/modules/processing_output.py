import pandas as pd

def processing_output(pred_df: pd.DataFrame):
    columns=["Italiani", "Stranieri"]
    # --------------------------------------------------
    # 6. Preprocessing output
    # --------------------------------------------------
    if "start_timestamp" in pred_df.columns:
        pred_df = pred_df.rename(columns={"start_timestamp": "Periodo"})

    if "predictions" not in pred_df.columns:
        # Usa il quantile 0.5 se presente come valore di predizione
        if "0.5" in pred_df.columns:
            pred_df["predictions"] = pred_df["0.5"]

    # Split dell'id serie: Metrica|Ambito|Nazionalita
    pred_df[["Metrica", "Ambito", "Nazionalita"]] = pred_df["series_id"].str.split("|", expand=True)

    # Pivot per portare le nazionalità da righe a colonne
    pred_wide = pred_df.pivot_table(
        index=["Periodo", "Metrica", "Ambito"],
        columns="Nazionalita",
        values="predictions"
    ).reset_index()

    # Seleziona solo le colonne richieste (Periodo, Metrica, Ambito + quelle in columns)
    # Usiamo un filtro per evitare errori se una colonna in 'columns' non esiste nel pivot
    cols_to_keep = ["Metrica", "Periodo", "Ambito"] + [c for c in columns if c in pred_wide.columns]
    pred_wide = pred_wide[cols_to_keep]

    # --------------------------------------------------
    # 7. Arrotondamento dinamico
    # --------------------------------------------------
    # Cicliamo su tutte le colonne specificate in input
    for col in columns:
        if col in pred_wide.columns:
            # fillna(0) evita errori se ci sono periodi senza dati per una certa nazionalità
            pred_wide[col] = pred_wide[col].fillna(0).round(0).astype(int)
            
    return pred_wide

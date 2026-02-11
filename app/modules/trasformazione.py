import pandas as pd

def trasformazione_wide_long(df: pd.DataFrame):
    # --------------------------------------------------
    # 2. Trasformazione WIDE -> LONG
    # --------------------------------------------------
    df_long = df.melt(
        id_vars=["Metrica", "Ambito", "Periodo"],
        value_vars= ["Italiani", "Stranieri"],
        var_name="Nazionalita",
        value_name="Valore"
    )

    # --------------------------------------------------
    # 3. Creazione ID unico
    # --------------------------------------------------
    df_long["series_id"] = (
        df_long["Metrica"].astype(str) + "|" +
        df_long["Ambito"].astype(str) + "|" +
        df_long["Nazionalita"].astype(str)
    )
    df_long = df_long.sort_values(["series_id", "Periodo"]).reset_index(drop=True)
    return df_long

def trasforma_long_to_wide(df_long: pd.DataFrame):
    """
    Ripristina il formato originale (Wide) partendo dal formato Long.
    Rimuove l'ID unico e riporta 'Italiani' e 'Stranieri' come colonne separate.
    """
    # 1. Effettuiamo il pivot per riportare le nazionalità in colonne separate
    df_wide = df_long.pivot(
        index=["Metrica", "Ambito", "Periodo"], 
        columns="Nazionalita", 
        values="Valore"
    ).reset_index()

    # 2. Pulizia: Rimuoviamo il nome assegnato all'indice delle colonne (Nazionalita)
    df_wide.columns.name = None
    
    # 3. Opzionale: Riordinamento colonne per tornare esattamente al setup iniziale
    # (Adatta l'ordine se il tuo file originale era diverso)
    colonne_finali = ["Metrica", "Ambito", "Periodo", "Italiani", "Stranieri"]
    df_wide = df_wide[colonne_finali]

    return df_wide

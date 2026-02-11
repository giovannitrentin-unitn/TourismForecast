import pandas as pd

def filtra_turismo_smart(df, livello='mensile', metrica=None, ambiti=None, data_inizio=None, data_fine=None):
    """
    Filtra e aggrega i dati.
    Output date: 'YYYY-MM' per mensile, 'YYYY-01' per annuale.
    """
    # Lavoriamo su una copia per non toccare il dataframe originale
    df_filtered = df.copy()
    
    # Assicuriamoci che la colonna Periodo sia in formato datetime
    df_filtered['Periodo'] = pd.to_datetime(df_filtered['Periodo'])

    # ---------------------------------------------------------
    # 1. FILTRO DATE (SMART)
    # ---------------------------------------------------------
    # È meglio filtrare le date PRIMA di aggregare per alleggerire il carico,
    # ma bisogna stare attenti alla logica "Annuale".
    
    if data_inizio:
        dt_start = pd.to_datetime(data_inizio)
        if livello == 'annuale':
            # Se siamo in annuale, prendiamo tutto l'anno di riferimento (dal 1° Gennaio)
            # per evitare di avere somme parziali sbagliate.
            dt_start = pd.to_datetime(f"{dt_start.year}-01-01")
        
        df_filtered = df_filtered[df_filtered['Periodo'] >= dt_start]

    if data_fine:
        dt_end = pd.to_datetime(data_fine)
        if livello == 'annuale':
            # Se siamo in annuale, prendiamo fino alla fine dell'anno indicato
            dt_end = pd.to_datetime(f"{dt_end.year}-12-31")
        else:
            # Se è mensile, ci assicuriamo di prendere l'ultimo giorno del mese (per sicurezza)
            dt_end = dt_end + pd.offsets.MonthEnd(0)
            
        df_filtered = df_filtered[df_filtered['Periodo'] <= dt_end]

    # ---------------------------------------------------------
    # 2. FILTRI ATTRIBUTI (Metrica e Ambiti)
    # ---------------------------------------------------------
    if metrica:
        if isinstance(metrica, str): metrica = [metrica]
        df_filtered = df_filtered[df_filtered['Metrica'].isin(metrica)]

    if ambiti:
        if isinstance(ambiti, str): ambiti = [ambiti]
        # Creiamo una regex sicura (escape delle stringhe speciali se necessario)
        pattern = '|'.join(ambiti)
        df_filtered = df_filtered[df_filtered['Ambito'].str.contains(pattern, case=False, na=False)]

    # ---------------------------------------------------------
    # 3. AGGREGAZIONE (LIVELLO)
    # ---------------------------------------------------------
    if livello.lower() == 'annuale':
        # A. Rinomina Ambiti
        keywords_strutture = ['alberghieri', 'extralberghieri']
        mask_strutture = df_filtered['Ambito'].str.contains('|'.join(keywords_strutture), case=False, na=False)
        
        df_filtered['Ambito'] = 'Totale luoghi'
        df_filtered.loc[mask_strutture, 'Ambito'] = 'Totale strutture'
        
        # B. Normalizzazione Data per Output 'YYYY-01'
        # Convertiamo ogni data al 1° Gennaio del rispettivo anno.
        # Questo permette al group by di sommare tutto sotto un'unica data per anno.
        df_filtered['Periodo'] = df_filtered['Periodo'].apply(lambda x: x.replace(month=1, day=1))
        
        # C. Group By (Somma)
        # Raggruppiamo per Metrica, Anno (normalizzato al 01-01) e Ambito
        df_filtered = df_filtered.groupby(['Metrica', 'Periodo', 'Ambito'], as_index=False).sum(numeric_only=True)

    # ---------------------------------------------------------
    # 4. FORMATTAZIONE OUTPUT
    # ---------------------------------------------------------
    # Poiché nel caso annuale abbiamo forzato le date al mese 01 (Gennaio),
    # possiamo usare lo stesso formato '%Y-%m' per entrambi i casi.
    # Annuale -> 2023-01-01 -> "2023-01"
    # Mensile -> 2023-05-01 -> "2023-05"
    
    df_filtered['Periodo'] = df_filtered['Periodo'].dt.strftime('%Y-%m')

    return df_filtered.sort_values(['Periodo', 'Metrica'])
def normalizza_anno_a_data(valore, isFinal=False):
    """
    Trasforma un anno (stringa o intero) in una data formato YYYY-01-01.
    Se il valore è già una data completa, lo mantiene invariato.
    """
    str_valore = str(valore).strip()
    
    # Se la stringa contiene solo 4 cifre, aggiungiamo mese e giorno
    if len(str_valore) == 4 and str_valore.isdigit():
        if isFinal:
            return f"{str_valore}-12-01"
        else:
            return f"{str_valore}-01-01" 
    
    # Altrimenti restituiamo il valore originale (o lo gestiamo come preferisci)
    return str_valore
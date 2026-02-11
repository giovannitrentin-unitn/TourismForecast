import pandas as pd

def formatta_periodo(df: pd.DataFrame):
    """
    Trasforma la colonna 'Periodo' dal formato YYYY-MM-DD al formato YYYY-MM.
    """
    # Assicuriamoci che la colonna sia in formato datetime
    df['Periodo'] = pd.to_datetime(df['Periodo'])
    
    # Trasformiamo in stringa Anno-Mese
    df['Periodo'] = df['Periodo'].dt.strftime('%Y-%m')
    
    return df
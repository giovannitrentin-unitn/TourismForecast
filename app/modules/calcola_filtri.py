import json
from datetime import datetime
from dateutil.relativedelta import relativedelta

def calcola_filtri(ambiti, metrica, data_inizio, data_fine_str, prediction_length, periodo_previsione="Mensile", output_file="app/filters/filters.json"):
    """
    Genera il JSON dei filtri applicando la logica:
    Se una lista contiene un solo valore, restituisce un array vuoto [].
    """
    
    # 1. Calcolo il periodo
    periodo = [data_inizio, calcola_periodo(data_fine_str, prediction_length, periodo_previsione)]

    if periodo_previsione.lower() == "mensile" :
        filtro_ambiti = ambiti
    else:
        filtro_ambiti = ["Totale luoghi", "Totale strutture"]
    filtro_metrica =  metrica 

    # 3. Costruzione del dizionario finale
    risultato = {
        "filters": {
            "ambito_mensile": filtro_ambiti,
            "metrica": filtro_metrica,
            "periodo_dati": periodo,
            "target": ["Italiani", "Stranieri"],
            "periodo_previsione": periodo_previsione
        }
    }
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            # indent=4 rende il file leggibile (formattato bene)
            # ensure_ascii=False serve per gestire correttamente i caratteri accentati (es. Pinè)
            json.dump(risultato, f, indent=4, ensure_ascii=False)
        print(f"File 'filters.json' salvato correttamente.")
    except Exception as e:
        print(f"Errore durante il salvataggio: {e}")


def calcola_periodo(data_inizio_str, n, tipologia="Mensile"):
    """
    Calcola la data finale aggiungendo n mesi o n anni a una data data.
    
    :param data_inizio_str: Stringa data (es. "2024-01-01")
    :param n: Numero di periodi da aggiungere
    :param tipologia: "mensile" o "annuale"
    :return: Oggetto datetime della data finale
    """
    # Convertiamo la stringa in oggetto datetime
    # Formato standard YYYY-MM-DD, personalizzalo se necessario
    data_dt = datetime.strptime(data_inizio_str, "%Y-%m")
    
    if tipologia.lower() == "mensile":
        # Aggiunge n mesi
        data_finale = data_dt + relativedelta(months=n)
    elif tipologia.lower() == "annuale":
        # Aggiunge n anni
        data_finale = data_dt + relativedelta(years=n)
    else:
        # Se la tipologia non è corretta, restituiamo la data originale o un errore
        print("Tipologia non valida. Usa 'mensile' o 'annuale'.")
        return data_dt

    return data_finale.strftime("%Y-%m")
import threading
import os
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import json
from modules import salva_json_predictions
from modules import calcola_filtri, calcola_periodo, calcola_totali, carica_dati, calcola_quatiles, conversione_json, filtra_dati, genera_prediction, normalizza_data, processing_output, trasformazione 
import pandas as pd

# 1. Calcoliamo il percorso assoluto della cartella dove si trova questo file (server.py)
base_dir = os.path.abspath(os.path.dirname(__file__))

# 2. Definiamo dove sono i template (HTML) e gli static (CSS/JS)
# Uniamo la cartella base con il percorso verso i tuoi template
template_dir = os.path.join(base_dir, 'template')
static_dir = os.path.join(base_dir, 'static') # Se hai anche CSS/JS lì

# 3. Inizializziamo l'App specificando le cartelle
app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
CORS(app) # Fondamentale per evitare blocchi di sicurezza del browser

input_csv = os.path.join(base_dir, 'data', 'dati.csv')
input_json = os.path.join(base_dir, 'data', 'dati.json')
output_json = os.path.join(base_dir, 'data', 'prediction.json')

input_filter = os.path.join(base_dir, 'filters', 'default_filters.json')
output_filter = os.path.join(base_dir, 'filters', 'filters.json')

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/genera_previsioni', methods=['POST'])
def elabora():
    # Recupero il contenuto filters
    content = request.get_json()
    data = content.get('filters', {})
    
    # NON CONTROLLO I DATI PERCHE LI HO GIA CONVALIDATI SUL CLIENT
    # Recupero i singoli valori 
    prediction_length = int(data.get('prediction_length'))
    precisione = int(data.get('prediction_precision'))
    ambiti = data.get('ambito_mensile')
    metrica = data.get('metrica')
    # Estraggo data inizio fine
    periodo_dati = data.get('periodo_dati')
    data_inizio = normalizza_data.normalizza_anno_a_data(periodo_dati[0])
    data_fine = normalizza_data.normalizza_anno_a_data(periodo_dati[1], True)
    # Estraggo il periodo di previsione
    periodo_previsione = data.get('periodo_previsione')
    # Calcolo i filtri possibili
    calcola_filtri.calcola_filtri(ambiti, metrica, data_inizio,data_fine, prediction_length, periodo_previsione, output_filter)
    # Carico i dati 
    dati = carica_dati.carica_dati(input_csv);
    # Filtro i vari dati
    dati = filtra_dati.filtra_turismo_smart(dati, periodo_previsione, metrica, ambiti, data_inizio, data_fine)
    # Trasformo la tabella
    dati = trasformazione.trasformazione_wide_long(dati)
    # Genero i quatiles
    quantiles = calcola_quatiles.genera_quantili(precisione)
    # Genero le previsioni
    predictions = genera_prediction.genera_prediction(dati, prediction_length, quantiles)
    # Processo l'output
    predictions_processed = processing_output.processing_output(predictions)
    # Sistemazione periodo
    prediction_periodo = calcola_periodo.formatta_periodo(predictions_processed)
    dati_processed = trasformazione.trasforma_long_to_wide(dati)
    old_data_json = conversione_json.conversione_json(dati_processed)
    # Converto in json i dati 
    new_data_json = conversione_json.conversione_json(prediction_periodo)
    # Salvo la prediction in json
    salva_json_predictions.salva_json(old_data_json, input_json)
    salva_json_predictions.salva_json(new_data_json, output_json)
    # Sparo al client i vecchi e i nuovi dati
    data_json = { "history": old_data_json , "forecast": new_data_json }

    return jsonify({"status": "success", "received": data_json}), 200

@app.route('/get_filters', methods=['GET'])
def filtra():
    file_principale = output_filter
    file_alternativo = input_filter
    
    # Controlla quale file esiste
    if os.path.exists(file_principale):
        file_da_caricare = file_principale
    elif os.path.exists(file_alternativo):
        file_da_caricare = file_alternativo
    else:
        # Se nessuno dei due esiste, ritorna un errore JSON
        return jsonify({"errore": "Nessun file disponibile"}), 404

    # Leggi il file JSON
    with open(file_da_caricare, 'r', encoding='utf-8') as f:
        dati_json = json.load(f)

    return jsonify({"status": "success", "received": dati_json}), 200


@app.route('/get_prediction', methods=['GET'])
def prediction():
    old_data_json = salva_json_predictions.carica_json(input_json)
    file_principale = output_json    
    # Controlla quale file esiste
    if os.path.exists(file_principale):
        new_data_json = salva_json_predictions.carica_json(output_json)
        data_json = { "history": old_data_json , "forecast": new_data_json }
        return jsonify({"status": "success", "received": data_json}), 200
    else:
        dati = carica_dati.carica_dati(input_csv);
        old_data_json = conversione_json.conversione_json(dati)
        salva_json_predictions.salva_json(old_data_json, input_json)
        data_json = { "history": old_data_json , "forecast": {} }
        return jsonify({"status": "success", "received": data_json}), 200



@app.route('/delete_prediction', methods=['GET'])
def elimina_lista_file():
    lista_file = [output_json, output_filter]
    for file_path in lista_file:
        try:
            # Controlla se il file esiste prima di provare a eliminarlo
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"✅ Eliminato: {file_path}")
            else:
                print(f"⚠️  Il file {file_path} non esiste già.")
        except Exception as e:
            print(f"❌ Errore durante l'eliminazione di {file_path}: {e}")
    return jsonify({"status": "success"}), 200

# 2. Funzione per avviare Flask
def run_flask():
    # Colab richiede l'host 0.0.0.0
    app.run(host='0.0.0.0', port=5000)

# 3. Avvio in parallelo
if __name__ == '__main__':
    # Avviamo Flask in un thread separato
    flask_thread = threading.Thread(target=run_flask)
    flask_thread.start()
    
    print("✅ Server Flask avviato in background.")
    
    # 4. Avvio del Tunnel (Esempio Cloudflare)
    # Assicurati di aver installato cloudflared su Colab
    print("🔗 Avvio del tunnel Cloudflare...")
    os.system("cloudflared tunnel --url http://localhost:5000")
import numpy as np

def genera_quantili(n: int):
    if not (0 <= n <= 10):
        return "Per favore, inserisci un numero tra 0 e 10."
    
    # Se n è 0 o 1, il comportamento dipende da cosa ti serve. 
    # Qui assumiamo che n sia il numero di punti desiderati.
    if n == 0: return [0.0]
    if n == 1: return [0.1]

    # Genera n punti da 0 a 1 inclusi
    lista_quantili = np.linspace(0.1, 0.99, n)
    return lista_quantili.tolist()

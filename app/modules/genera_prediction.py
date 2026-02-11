import pandas as pd
from chronos import BaseChronosPipeline

def genera_prediction(df_long: pd.DataFrame, prediction_length: int = 36, quantile_levels=[0.0, 0.25, 0.5, 0.75, 1.0]):
    # --------------------------------------------------
    # 4. Caricamento modello Chronos
    # --------------------------------------------------
    pipeline = BaseChronosPipeline.from_pretrained(
        "autogluon/chronos-2",
        device_map="auto",
        torch_dtype="auto"
    )

    # --------------------------------------------------
    # 5. Predizione
    # --------------------------------------------------
    pred_df = pipeline.predict_df(
        df_long,
        prediction_length=prediction_length,
        quantile_levels=quantile_levels,
        id_column="series_id",
        timestamp_column="Periodo",
        target="Valore"
    )
    return pred_df
import pandas as pd
from io import BytesIO

def parse_template_csv(file_content: bytes) -> pd.DataFrame:
    """
    Parses the imported template (could be .xls, .xlsx, or a disguised TSV/CSV) 
    into a pandas DataFrame.
    """
    try:
        # Try reading as an actual Excel file first
        df = pd.read_excel(BytesIO(file_content))
    except Exception:
        try:
            # Fallback 1: Blackboard often exports files as UTF-16LE with tab separators
            # but names them .xls
            df = pd.read_csv(BytesIO(file_content), encoding='utf-16', sep='\t')
        except Exception:
            # Fallback 2: Maybe it's just a regular CSV named .xls
            df = pd.read_csv(BytesIO(file_content))
            
    return df

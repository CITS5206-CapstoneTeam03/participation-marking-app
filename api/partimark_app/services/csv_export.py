import pandas as pd
from typing import List

# Assuming you imported your DB models, e.g.:
# from models.marks import ParticipationMark

def generate_lms_export(marks: List, assessment_column_name: str) -> str:
    """
    Generates a CSV string formatted perfectly for the client's LMS import process.
    The LMS explicitly requires exact header names and empty buffer columns to validate the file.
    
    Args:
        marks: A list of ParticipationMark database models (must have the .student relationship loaded)
        assessment_column_name: The exact string title of the Assessment column inside the LMS.
    
    Returns:
        A raw string containing the formatted CSV file contents.
    """
    export_data = []
    
    for mark in marks:
        # Resolve Student Relationship Data safely. 
        # (Requires the API query to include `joinedload(ParticipationMark.student)`)
        student = getattr(mark, "student", None)
        
        # Ensure fallback safety in case relationship wasn't loaded 
        first_name = getattr(student, "first_name", "") if student else ""
        last_name = getattr(student, "last_name", "") if student else ""
        
        # Client note: Column F ("Availability") uses "yes" or "no".
        is_active = getattr(student, "is_active", True) if student else True
        availability_str = "Yes" if is_active else "No"
        
        row = {
            "Last Name": last_name,
            "First Name": first_name,
            "Username": mark.student_id,  # Client Instruction: Column C must contain the student ID
            "Student ID": "",             # Client Instruction: Column D must exist but remain strictly empty
            "Last Access": "",            # Client Instruction: Required header, but no data needed
            "Availability": availability_str,
            assessment_column_name: mark.score  # The dynamic column name the LMS is expecting this week
        }
        export_data.append(row)
        
    # Convert to DataFrame
    df = pd.DataFrame(export_data)
    
    # Dump to CSV string. 
    # (If the LMS specifically demands the corrupted UTF-16LE TSV format mimicking .xls, 
    # you can change this to `sep='\t'` and `encoding='utf-16le'`)
    return df.to_csv(index=False)
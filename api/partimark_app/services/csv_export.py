from ..models.students import Student
from typing import List
import pandas as pd

# Assuming you imported your DB models, e.g.:
# from models.marks import ParticipationMark

def generate_lms_export(
    marks: dict[tuple[str, str, str], tuple[int,float]], 
    inactive_students: List[Student]
) -> str:
    """
    Generates a CSV string formatted perfectly for the client's LMS import process.
    """
    export_data = []
    
    for (student_id, first_name, last_name), (total, percent) in marks.items():
        row = {
            "Last Name": last_name,
            "First Name": first_name,
            "Username": student_id,  # Client Instruction: Column C must contain the student ID
            "Student ID": "",             # Client Instruction: Column D must exist but remain strictly empty
            "Last Access": "",            # Client Instruction: Required header, but no data needed
            "Availability": "yes",
            "Total": total, #TO DO: Placeholder waiting for client confirm
            "Percentage": percent #TO DO: Placeholder waiting for client confirm
        }
        export_data.append(row)
    
    for student in inactive_students:
        row = {
            "Last Name": student.last_name,
            "First Name": student.first_name,
            "Username": student.student_id,  # Client Instruction: Column C must contain the student ID
            "Student ID": "",             # Client Instruction: Column D must exist but remain strictly empty
            "Last Access": "",            # Client Instruction: Required header, but no data needed
            "Availability": "no",
            "Total": None,
            "Percentage": None
        }
        export_data.append(row)

    # Convert to DataFrame
    df = pd.DataFrame(export_data)
    
    # Dump to CSV string. 
    # (If the LMS specifically demands the corrupted UTF-16LE TSV format mimicking .xls, 
    # you can change this to `sep='\t'` and `encoding='utf-16le'`)
    return df.to_csv(index=False)
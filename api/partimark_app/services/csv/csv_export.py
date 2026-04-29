from ...models.students import Student
from typing import List
import pandas as pd

# Assuming you imported your DB models, e.g.:
# from models.marks import ParticipationMark

def generate_lms_export(
    template_df: pd.DataFrame,
    marks: dict[tuple[str, str, str], tuple[int,float]], 
    inactive_students: List[Student]
) -> str:
    """
    Fills in the LMS CSV template with calculated marks.
    """
    # row = {
    #     "Last Name": last_name,
    #     "First Name": first_name,
    #     "Username": student_id,  # Client Instruction: Column C must contain the student ID
    #     "Student ID": "",             # Client Instruction: Column D must exist but remain strictly empty
    #     "Last Access": "",            # Client Instruction: Required header, but no data needed
    #     "Availability": "yes",
    #     ColG: retrieved from imported file
    #     ColH: retrieved from imported file
    # }

    # Find the Total and Percentage columns in the template
    total_col = None
    percent_col = None
    
    for col in template_df.columns:
        col_lower = str(col).lower()
        if "total" in col_lower:
            total_col = col
        if "percent" in col_lower:
            percent_col = col

    if not total_col or not percent_col:
        raise ValueError("Could not find 'Total' and/or 'Percentage' columns in the uploaded template.")

    # Create a mapping of Username -> (total, percent)
    # The marks dict uses (student_id, first_name, last_name) as the key.
    # The student_id maps to 'Username' in Blackboard.
    marks_by_username = {student_id: (total, percent) for (student_id, first_name, last_name), (total, percent) in marks.items()}
    inactive_usernames = {student.student_id for student in inactive_students}

    # Ensure Username column exists
    username_col = None
    for col in template_df.columns:
        if "username" in str(col).lower():
            username_col = col
            break
            
    if not username_col:
        raise ValueError("Could not find a 'Username' column in the uploaded template.")

    # Fill in the data
    for index, row in template_df.iterrows():
        username = str(row[username_col])
        if username in marks_by_username:
            total, percent = marks_by_username[username]
            template_df.at[index, total_col] = total
            template_df.at[index, percent_col] = percent
        elif username in inactive_usernames:
            template_df.at[index, total_col] = None
            template_df.at[index, percent_col] = None

    # Return as CSV string
    return template_df.to_csv(index=False)
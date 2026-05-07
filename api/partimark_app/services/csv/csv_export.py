from ...models.students import Student
from typing import List
import pandas as pd

# Assuming you imported your DB models, e.g.:
# from models.marks import ParticipationMark

def generate_lms_export(
    template_df: pd.DataFrame,
    marks: dict[tuple[str, str, str], tuple[float, float]], 
    inactive_students: List[Student]
) -> str:
    """
    Fills in the LMS CSV template with calculated marks.
    """
    # row = {
    #     "Last Name": last_name,
    #     "First Name": first_name,
    #     "Username": student_id,       # Client Instruction: Column C must contain the student ID
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
        
        # Blackboard specific percentage column (always out of 100)
        if "total pts: 100" in col_lower:
            percent_col = col
            continue
            
        # Blackboard specific total column (has max points, not 100)
        if "total pts:" in col_lower and "100" not in col_lower:
            total_col = col
            continue

        # Generic fallback for standard headers
        if "percent" in col_lower and not percent_col:
            percent_col = col
        elif "total" in col_lower and not total_col:
            total_col = col

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

    # Clean up phantom empty rows pandas might parse if the CSV has trailing commas
    template_df = template_df.dropna(how='all')

    #Populate sheet with data 
    if template_df.empty or template_df[username_col].isnull().all():
        new_rows = []
        for (student_id, first_name, last_name), (total, percent) in marks.items():
            new_row = {col: "" for col in template_df.columns}
            for col in template_df.columns:
                col_lower = str(col).lower()
                if "username" in col_lower:
                    new_row[col] = student_id
                elif "first name" in col_lower:
                    new_row[col] = first_name
                elif "last name" in col_lower:
                    new_row[col] = last_name
                elif "student id" in col_lower:
                    new_row[col] = ""  # Client Instruction: Must remain strictly empty
                elif "availability" in col_lower:
                    new_row[col] = "Yes"
                elif col == total_col:
                    new_row[col] = total
                elif col == percent_col:
                    new_row[col] = percent
            new_rows.append(new_row)
            
        if new_rows:
            template_df = pd.concat([template_df, pd.DataFrame(new_rows)], ignore_index=True)
            
    else:
        # Fill in the data for existing rows
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
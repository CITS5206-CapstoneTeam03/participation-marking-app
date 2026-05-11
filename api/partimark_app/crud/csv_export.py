from sqlalchemy.orm import Session
from .crud_marks import get_all_sum_marks, get_all_6w_sum_marks
from .crud_system_config import get_current_system_config


def calculate_total_and_percent_mark(db: Session) -> dict[tuple[str,str,str], tuple[int, float]]:
    """
    Caculate final semester scores
    """
    sum_marks = get_all_sum_marks(db)

    #Get max point
    config = get_current_system_config(db)
    final = config.total_participation_points if config and config.total_participation_points > 0 else 1

    return {
        (student_id, first_name, last_name): (total, (total/final)*100)
        for student_id, first_name, last_name, total in sum_marks
    }

def calculate_w6_total_and_percent_mark(db: Session) -> dict[tuple[str,str,str], tuple[int, float]]:
    """
    Calculate half-semester scores
    """
    sum_marks = get_all_6w_sum_marks(db)

    #Get max point
    config = get_current_system_config(db)
    final = config.total_participation_points if config and config.total_participation_points > 0 else 1

    return {
        (student_id, first_name, last_name): (total, (total/final)*100)
        for student_id, first_name, last_name, total in sum_marks
    }
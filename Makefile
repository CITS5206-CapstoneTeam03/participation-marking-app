PYTHON ?= python3
VENV_DIR := .venv
BACKEND_DIR := api

.PHONY: backend-setup backend-run backend

backend-setup:
	$(PYTHON) -m venv $(VENV_DIR)
	$(VENV_DIR)/bin/pip install -r $(BACKEND_DIR)/requirements.txt

backend-run:
	$(VENV_DIR)/bin/uvicorn api.main:app --reload --port 8000

backend: backend-setup backend-run

PYTHON ?= python
VENV_DIR ?= venv
BACKEND_DIR := api

ifeq ($(OS),Windows_NT)
VENV_PYTHON := $(VENV_DIR)/Scripts/python.exe
else
VENV_PYTHON := $(VENV_DIR)/bin/python
endif

.PHONY: backend-setup backend-run frontend-run backend

backend-setup:
	$(PYTHON) -m venv $(VENV_DIR)
	$(VENV_PYTHON) -m pip install -r $(BACKEND_DIR)/requirements.txt

backend-run:
	cd $(BACKEND_DIR) && ../$(VENV_PYTHON) -m uvicorn partimark_app.main:app --reload --port 8000

frontend-run:
	npm run dev

backend: backend-setup backend-run

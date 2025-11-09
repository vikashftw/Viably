# Viably

This document contains instructions for running the components updated in the recent changes.

## Running the Backend API

The backend is a FastAPI application. To run the development server, follow these steps:

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```

2.  Activate the virtual environment:
    ```bash
    .\venv\Scripts\activate
    ```

3.  Start the server:
    ```bash
    uvicorn main:app --reload
    ```
    The API will be available at `http://localhost:8000`.

## Running Backend Tests

To verify the agent functionality, you can run the test script. Execute the following command from the project's root directory:

```bash
.\backend\venv\Scripts\python.exe backend\test_agents.py
```
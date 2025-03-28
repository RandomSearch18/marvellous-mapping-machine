# Marvellous Mapping Machine

## Try it out

**🧑‍💻 Visit <https://marvellous-mapping-machine.pages.dev/> to use the app :D**

Alternative domains:

- <https://mmmm.20240821.xyz/>

## Development instructions for backend

### Preparation

Ensure you have Python v3.10+ installed.

Clone the repository and change directory to the `backend` folder in this repository:

```bash
cd backend
```

### Virtual environment

Create a virtual environment. For example, on a personal computer running Linux, you can create a venv in the project directory:

```bash
python3 -m venv .venv
```

If you're on a school computer, you can't create a venv in your `H:` drive, so create it somewhere on the `C:` drive. E.g. in Git Bash:

```bash
py -m venv "$USERPROFILE/venvs/marvellous-mapping-machine"
```

Or in Powershell:

```powershell
py -m venv "$env:USERPROFILE\venvs\marvellous-mapping-machine"
```

### Activate the virtual environment

In VSCode, run the **Python: Select Interpreter** command. If the venv is in the project directory, you can directly select it from the list. If it's elsewhere, manually enter the path to the venv.

Alternatively, activate the venv in the terminal, e.g. in Linux:

```bash
source .venv/bin/activate
```

### Install dependencies

```bash
python -m pip install -r backend/requirements.txt
```

### Run the program

```bash
python backend/main.py
```

## Development instructions for frontend

### Preparation

Ensure you have Node.JS and Yarn v1 installed.

Clone the repository and change directory to the `frontend` folder in this repository:

```bash
cd frontend
```

### Install dependencies

Run:

```bash
yarn
```

### Start development server

Run

```bash
yarn dev
```

And access the frontend using the URL displayed in your terminal.

### Quirks

Note that Python code is only updated when the build tool starts (i.e. no live reload), so if you want to edit Python code while previewing the frontend, you should restart the Vite dev server after editing to see your changes.

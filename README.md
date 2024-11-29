# Marvellous mapping machine

## Development instructions

Clone the repository and ensure you have Python v3.10+ installed.

### Virtual environment

Create a virtual environment. For example, on a personal computer running Linux, you can create a venv in the project directory:

```bash
python3 -m venv .venv
```

If you're on a school computer, you can't create a venv in your `:H` drive, so create it on the `C:` drive. E.g. in Git Bash:

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
from pathlib import Path
from sys import argv, stderr

import osmnx
import osmnx.graph


def print_error(message: str):
    """Prints an error message to stderr"""
    print(message, file=stderr)


def validate_args():
    """Returns True if the number of command-line arguments to the program is correct.
    Otherwise, prints an appropriate error message and returns False."""
    if len(argv) == 2:
        return True
    if len(argv) < 2:
        print_error(
            f"Too few arguments. Please provide a path to the OSM data file, e.g. {argv[0]} region.osm",
        )
        return False
    print_error(
        f"Too many arguments. Please provide a path to the OSM data file, e.g. {argv[0]} region.osm",
    )
    return False


def get_data_file_path():
    """Returns the path to the OSM data file that should be used by the routing engine"""
    return argv[1]


def validate_file_is_readable(file_path: str):
    """Returns True if the provided path points to an existing, readable, file-y file.
    Otherwise, prints an appropriate error message and returns False."""
    try:
        with open(file_path, "r") as file:
            if not Path(file.name).is_file():
                print_error(f"Cannot access {file_path}: not a file")
                return False
            return True

    except FileNotFoundError:
        print_error(f"File {file_path} not found.")
        return False
    except IsADirectoryError:
        print_error(f"Cannot access {file_path}: is a directory")
        return False
    except PermissionError:
        print_error(f"Cannot access file {file_path}: permission denied")
        return False


if __name__ == "__main__":
    if not validate_args():
        exit(1)
    data_file_path = get_data_file_path()
    if not validate_file_is_readable(data_file_path):
        exit(1)
    print(f"Using OSM data file {data_file_path}")

    # Use OSMnx to parse the data and create a graph
    graph = osmnx.graph.graph_from_xml(data_file_path, bidirectional=True)
    print(graph)

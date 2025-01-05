from pathlib import Path
from sys import argv, stderr

from networkx import astar_path
from osm_data_types import BoundingBox
from routing_engine import RouteCalculator, RoutingEngine, RoutingOptions
import xml.etree.ElementTree


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
    # Check that we've been provided with a data file that we can read
    # if not validate_args():
    #     exit(1)
    # data_file_path = get_data_file_path()
    # if not validate_file_is_readable(data_file_path):
    #     exit(1)
    # print(f"Using OSM data file {data_file_path}")

    routing_engine = RoutingEngine()
    # try:
    #     routing_graph = routing_engine.compute_graph(data_file_path)
    #     print(
    #         f"Generated routing graph with {len(routing_graph.graph.nodes)} nodes and {len(routing_graph.graph.edges)} edges"
    #     )
    #     print(routing_graph)
    # except xml.etree.ElementTree.ParseError as error:
    #     print_error(f"Failed to parse OSM data")
    #     print_error(f"Invalid XML: {error}")
    print("Downloading OSM data")
    ways, raw_nodes = routing_engine.download_osm_data(
        BoundingBox(51.26268, -0.41497, 51.27914, -0.36755)
    )
    print("Computing routing graph")
    routing_graph = routing_engine.compute_graph(ways, raw_nodes)
    calculator = RouteCalculator(routing_graph, RoutingOptions())
    print("Calculating route")
    start = 51.273330, -0.397460
    end = 51.274179, -0.391324
    route = calculator.calculate_route_a_star(start, end)

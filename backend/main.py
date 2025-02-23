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


def export_to_js_window():
    """Makes important classes available to JS code by adding them to the window object.

    Throws an ImportError if we're not running in a browser with PyScript.
    """
    from pyscript import window  # type: ignore

    window.py = window.Object.new()
    window.py.RoutingEngine = RoutingEngine
    window.py.RouteCalculator = RouteCalculator
    window.py.RoutingOptions = RoutingOptions
    window.py.BoundingBox = BoundingBox
    window.py.one = 1
    # routing_engine = RoutingEngine()
    # print(routing_engine)
    # print("Adding routing engine to window")
    # window.py.routing_engine = routing_engine
    # print("added a routing engine")
    # window.py.download_osm_data = routing_engine.download_osm_data
    window.console.debug("Added routing engine exports to window.py")


if __name__ == "__main__":
    try:
        export_to_js_window()
    except ImportError:
        routing_engine = RoutingEngine()
        print("Downloading OSM data")
        ways, raw_nodes = routing_engine.download_osm_data(
            BoundingBox(51.26268, -0.41497, 51.27914, -0.36755)
        )
        print("Computing routing graph")
        routing_graph = routing_engine.compute_graph(ways, raw_nodes)
        calculator = RouteCalculator(
            routing_graph,
            RoutingOptions(
                {
                    "unpaved_paths": 0,
                    "paved_paths": 0,
                    "covered_paths": 1,
                    "indoor_paths": 0,
                    "pavements": 0,
                    "lit_paths": 0,
                    "steps": 0,
                    "prefer_marked_crossings": False,
                    "prefer_traffic_light_crossings": False,
                    "prefer_audible_crossings": False,
                    "prefer_dipped_kerbs": False,
                    "prefer_tactile_paving": False,
                    "allow_private_access": False,
                    "allow_customer_access": True,
                    "allow_walking_on_roads": True,
                    "allow_higher_traffic_roads": True,
                    "rights_of_way": 1,
                    "maintained_paths": 1,
                    "desire_paths": 0,
                    "treacherous_paths": -1,
                    "wheelchair_accessible": False,
                }
            ),
        )
        print("Calculating route")
        # start = 51.273330, -0.397460
        start = +51.27347, -0.397916
        # end = 51.274179, -0.391324
        end = +51.268984, -0.394485
        route = calculator.calculate_route_a_star(start, end)
        print(
            f"Route with {len(route.parts)} parts, {route.total_distance():.0f} meters, {route.total_time():.0f} seconds"
        )

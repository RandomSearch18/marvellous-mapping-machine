import networkx
import osmnx.convert
import osmnx.graph

from osm_data_types import Coordinates


class RoutingGraph:
    def __init__(self, graph: networkx.Graph):
        self.osm_data = None  # TODO
        self.graph = graph


class RoutingOptions:
    pass


class RouteResult:
    # TODO
    def __init__(self):
        raise NotImplementedError


class RouteCalculator:
    def __init__(self, graph: RoutingGraph, options: RoutingOptions):
        self.graph = graph
        self.options = options

    def calculate_route(self, start: Coordinates, end: Coordinates) -> RouteResult:
        # TODO
        raise NotImplementedError


class RoutingEngine:
    def __init__(self):
        pass

    def compute_graph(self, map_data_path: str) -> RoutingGraph:
        # Use OSMnx to parse the map data and create a graph
        directed_graph = osmnx.graph.graph_from_xml(map_data_path, bidirectional=True)
        undirected_graph = osmnx.convert.to_undirected(directed_graph)
        return RoutingGraph(undirected_graph)

import networkx
import osmnx.convert
import osmnx.graph


class RoutingGraph:
    def __init__(self, graph: networkx.Graph):
        self.osm_data = None  # TODO
        self.graph = graph


class RoutingEngine:
    def __init__(self):
        pass

    def compute_graph(self, map_data_path: str) -> RoutingGraph:
        # Use OSMnx to parse the map data and create a graph
        directed_graph = osmnx.graph.graph_from_xml(map_data_path, bidirectional=True)
        undirected_graph = osmnx.convert.to_undirected(directed_graph)
        return RoutingGraph(undirected_graph)

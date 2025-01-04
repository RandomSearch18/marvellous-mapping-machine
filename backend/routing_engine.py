import networkx
import osmnx.convert
import osmnx.graph
import requests
from osm_data_types import BoundingBox, Coordinates, OSMNode, OSMWay


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

    def download_osm_data(self, bbox: BoundingBox) -> tuple[list[OSMWay], dict]:
        query = f"""
        [out:json][timeout:300];
        (
            way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link|living_street|service|pedestrian|track|road|footway|bridleway|steps|corridor|path|emergency_bay|cycleway)$"]({bbox});
            node(w);
        );
        out geom;
        """
        response = requests.get(
            "https://overpass-api.de/api/interpreter", params={"data": query}
        )
        response.raise_for_status()
        response_json = response.json()

        raw_nodes = {}
        ways = []
        for node in response_json["elements"]:
            if node["type"] != "node":
                continue
            raw_nodes[node["id"]] = node
        for way in response_json["elements"]:
            if way["type"] != "way":
                continue
            nodes = []
            for node_id in way["nodes"]:
                node: dict = raw_nodes[node_id]
                tags = node.get("tags", {})
                nodes.append(OSMNode(pos=(node["lat"], node["lon"]), tags=tags))
            ways.append(OSMWay(nodes=nodes, tags=way["tags"]))
        return ways, raw_nodes

    def compute_graph(self, map_data_path: str) -> RoutingGraph:
        # Use OSMnx to parse the map data and create a graph
        directed_graph = osmnx.graph.graph_from_xml(map_data_path, bidirectional=True)
        undirected_graph = osmnx.convert.to_undirected(directed_graph)
        return RoutingGraph(undirected_graph)

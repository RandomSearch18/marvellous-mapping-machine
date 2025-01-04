import networkx
import requests
from osm_data_types import BoundingBox, Coordinates, OSMNode, OSMWay
from geographiclib.geodesic import Geodesic

geodesic_wgs84: Geodesic = Geodesic.WGS84  # type: ignore


def distance_between_points(a: Coordinates, b: Coordinates) -> float:
    result = geodesic_wgs84.Inverse(a[0], a[1], b[0], b[1])
    distance_meters = result["s12"]
    return distance_meters


class RoutingGraph:
    def __init__(self, graph: networkx.Graph):
        self.osm_data = None  # TODO
        self.graph = graph

    def get_edges_from_way(self, target_way_id: int) -> list[tuple[int, int]]:
        edges = []
        for node_a, node_b, way_id in self.graph.edges.data("id", default=0):  # type: ignore
            if way_id == target_way_id:
                edges.append((node_a, node_b))
        return edges


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
                nodes.append(
                    OSMNode(id=node_id, pos=(node["lat"], node["lon"]), tags=tags)
                )
            ways.append(OSMWay(id=way["id"], nodes=nodes, tags=way["tags"]))
        return ways, raw_nodes

    def compute_graph(
        self, ways: list[OSMWay], raw_nodes: dict[int, dict]
    ) -> RoutingGraph:
        graph = networkx.Graph()
        for way in ways:
            for i in range(len(way.nodes) - 1):
                node_from = way.nodes[i]
                node_to = way.nodes[i + 1]
                graph.add_edge(
                    node_from.id,
                    node_to.id,
                    tags=way.tags,
                    id=way.id,
                    length=distance_between_points(node_from.pos, node_to.pos),
                )
        tagged_nodes = {
            node_id: node for node_id, node in raw_nodes.items() if "tags" in node
        }
        for node_id, node in tagged_nodes.items():
            if node in graph:
                graph.nodes[node_id]["tags"] = node["tags"]
                graph.nodes[node_id]["pos"] = (node["lat"], node["lon"])
        return RoutingGraph(graph)

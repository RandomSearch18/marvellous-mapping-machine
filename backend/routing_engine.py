import networkx
import requests
from route_result import Arrive, RoutePart, RouteProgression, RouteResult, StartWalking
from osm_data_types import BoundingBox, Coordinates, OSMNode, OSMWay
from geographiclib.geodesic import Geodesic

geodesic_wgs84: Geodesic = Geodesic.WGS84  # type: ignore


def distance_between_points(a: Coordinates, b: Coordinates) -> float:
    result = geodesic_wgs84.Inverse(a[0], a[1], b[0], b[1])
    distance_meters = result["s12"]
    return distance_meters


def euclidean_distance(a: Coordinates, b: Coordinates) -> float:
    """Euclidean distance for two sets of coordinates.

    - Doesn't really make sense in terms of points on Earth, but it's useful as a simple heuristic
    - Units: none really, the outputs only make sense relative to each other
    """
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5


class RoutingGraph:
    def __init__(self, graph: networkx.Graph):
        self.osm_data = None  # TODO
        self._graph = graph

    def get_edges_from_way(self, target_way_id: int) -> list[tuple[int, int]]:
        edges = []
        for node_a, node_b, way_id in self._graph.edges.data("id", default=0):  # type: ignore
            if way_id == target_way_id:
                edges.append((node_a, node_b))
        return edges

    def nearest_node(self, coordinates: Coordinates) -> int:
        nearest_node = None
        nearest_distance = float("inf")
        for node_id in self._graph.nodes():
            node_coordinates = self.node_position(node_id)
            distance = distance_between_points(coordinates, node_coordinates)
            if distance < nearest_distance:
                nearest_distance = distance
                nearest_node = node_id
        if nearest_node is None:
            raise ValueError("No nodes could be found")
        return nearest_node

    def get_edge_between_nodes(self, node_a: int, node_b: int) -> dict:
        # Here we're assuming that there aren't any ways (therefore edges) that share the same two consecutive nodes!
        # This won't always be the case, but I'm not sure how to handle that edge case...
        return self._graph.edges[node_a, node_b]

    def node(self, node_id: int) -> dict:
        return self._graph.nodes[node_id]

    def node_position(self, node_id: int) -> Coordinates:
        return self._graph.nodes[node_id]["pos"]


class RoutingOptions:
    pass


class RouteCalculator:
    def __init__(self, graph: RoutingGraph, options: RoutingOptions):
        self.graph = graph
        self.options = options

    def calculate_weight(self, node_a: int, node_b: int, data: dict[str, str]) -> float:
        # TODO: do
        return float(data["length"])

    def estimate_time(self, way_data: dict) -> float:
        # Based on my average walking speed of 3.3 km/h
        # TODO this should be an option!
        BASE_SPEED = 0.92  # meters per second
        distance = way_data["length"]
        # TODO we should take into account way attributes, obviously
        return distance / BASE_SPEED

    def calculate_route_a_star(
        self, start_pos: Coordinates, end_pos: Coordinates
    ) -> RouteResult:
        start_node = self.graph.nearest_node(start_pos)
        end_node = self.graph.nearest_node(end_pos)

        # Use a very simple heuristic of pretending that the coordinates are cartesian and using Euclidean distance
        # maybe this can be refined in the future, maybe it won't be
        def heuristic(node_from, node_to):
            return euclidean_distance(
                self.graph.node_position(node_from), self.graph.node_position(node_to)
            )

        # So that we're not passing class methods around as callbacks:
        def weight(node_from, node_to, data):
            return self.calculate_weight(node_from, node_to, data)

        # Perform find the most optimal route using NetworkX's A* algorithm
        nodes: list[int] = networkx.astar.astar_path(
            self.graph._graph,
            start_node,
            end_node,
            heuristic=heuristic,
            weight=weight,  # type: ignore
        )

        for node in nodes:
            print(f"https://www.openstreetmap.org/node/{node}")

        # Reconstruct the route, to get a list of RouteParts
        parts: list[RoutePart] = []
        parts.append(StartWalking(self.graph.node_position(start_node)))
        for i in range(1, len(nodes)):
            node_from = nodes[i - 1]
            node_to = nodes[i]
            # Find the edge that we're routing along.
            # This gets a bit weird when there are multiple edges between the same two nodes,
            # but I'm ignoring that possibility for now
            edge_data = self.graph.get_edge_between_nodes(node_from, node_to)
            distance = edge_data["length"]
            estimated_time = self.estimate_time(edge_data)
            parts.append(
                RouteProgression(
                    distance,
                    estimated_time,
                    start=self.graph.node_position(node_from),
                    end=self.graph.node_position(node_to),
                )
            )
        parts.append(Arrive(self.graph.node_position(end_node)))
        return RouteResult(start_pos, end_pos, parts)


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
        for node_id, node in raw_nodes.items():
            if node["id"] in graph.nodes:
                graph.nodes[node_id]["pos"] = (node["lat"], node["lon"])
                if "tags" in node:
                    graph.nodes[node_id]["tags"] = node["tags"]
        return RoutingGraph(graph)

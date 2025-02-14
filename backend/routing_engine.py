from math import inf
from typing import Literal
from warnings import warn
import networkx
import requests
from route_result import Arrive, RoutePart, RouteProgression, RouteResult, StartWalking
from osm_data_types import (
    BoundingBox,
    Coordinates,
    OSMNode,
    OSMWay,
    OSMWayData,
    truthy_tag,
    way_has_sidewalk,
    way_incline_gradient,
    way_maxspeed_mph,
    way_width_meters,
)
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


type AvoidPreferNeutral = Literal[-1] | Literal[0] | Literal[1]
type RoutingOptionValue = AvoidPreferNeutral | bool


class RoutingOptions:
    def __init__(self, options: dict):
        # Ensure the options is a proper Python dict
        # (because JS code may call this function)
        if type(options).__name__ == "JsProxy":
            options = options.to_py()  # type: ignore
        for key, value in options.items():
            valid_value = value in [-1, 0, 1] or isinstance(value, bool)
            if not valid_value:
                raise ValueError(f"Invalid option value: {key}={value}")
        self.options: dict[str, RoutingOptionValue] = options

    def get_tri_state(self, key: str) -> AvoidPreferNeutral:
        value = self.options[key]
        if isinstance(value, bool):
            raise ValueError(
                f"Option {key} is not a tri-state (avoid/prefer/neutral) value"
            )
        return value

    def get_bool(self, key: str) -> bool:
        value = self.options[key]
        if not isinstance(value, bool):
            raise ValueError(f"Option {key} is not a boolean value")
        return value

    def true(self, key: str) -> bool:
        return self.get_bool(key)

    def neutral(self, key: str) -> bool:
        return self.get_tri_state(key) == 0

    def positive(self, key: str) -> bool:
        return self.options[key] == 1

    def negative(self, key: str) -> bool:
        return self.options[key] == -1


class RouteCalculator:
    def __init__(self, graph: RoutingGraph, options: RoutingOptions):
        self.graph = graph
        self.options = options
        # Stores way weights as they are calculated, for debugging only
        self.way_weights = {}
        self.segment_weights = {}

    def way_weights_js(self):
        try:
            from pyodide.ffi import to_js  # type: ignore
        except ImportError as error:
            raise ImportError("Must be running under Pyodide") from error
        return to_js(self.way_weights)

    def segment_weights_js(self):
        try:
            from pyodide.ffi import to_js  # type: ignore
        except ImportError as error:
            raise ImportError("Must be running under Pyodide") from error
        return to_js(list(self.segment_weights.values()))

    def add_implicit_tags(self, way: dict):
        if way.get("highway") == "motorway" or way.get("highway") == "motorway_link":
            way.setdefault("foot", "no")
        if way.get("service") == "driveway":
            way.setdefault("access", "private")
        if way.get("service") == "parking_aisle":
            # assumes access=yes if access=* isn't present
            if (not way.get("access")) or way.get("access") == "yes":
                way.setdefault("foot", "yes")
        if way.get("service") == "emergency_access":
            way.setdefault("access", "no")
        if way.get("service") == "bus":
            way.setdefault("foot", "no")

    def access_is_legal(self, tags: dict) -> bool:
        """Checks if the provided node or way is legal to be walked on

        - Uses access tags and the routing options to determine if access should be allowed
        - Only considers pedestrian access
        - Returns `True` if legal access is allowed, or `False` if access shouldn't be allowed
        - Assumes `True` if access tags aren't present
        """
        access = tags.get("foot") or tags.get("access")
        if access == "no":
            return False
        if access == "private" and not self.options.true("allow_private_access"):
            return False
        if access in ["customers", "permit"] and not self.options.true(
            "allow_customer_access"
        ):
            return False
        if access in ["agricultural", "forestry", "delivery", "military"]:
            return False
        return True

    def base_weight_road(self, way: dict) -> float | None:
        # In the future we might want consider additional factors in this method,
        # hence the logic where we start with a weight of 1 and multiply it.
        weight = 1
        match way.get("highway"):
            case "motorway" | "motorway_link":
                weight *= 50_000
            case "trunk" | "trunk_link":
                weight *= 10_000
            case "primary" | "primary_link":
                weight *= 20
            case "secondary" | "secondary_link":
                weight *= 15
            case "tertiary" | "tertiary_link":
                weight *= 5 if self.options.true("allow_higher_traffic_roads") else 10
            case "unclassified":
                weight *= 4 if self.options.true("allow_higher_traffic_roads") else 6
            case "residential":
                weight *= 3
            case "living_street":
                weight *= 1.5
            case "service":
                match way.get("service"):
                    case "driveway":
                        weight *= 1
                    case "parking_aisle" | "parking":
                        weight *= 2
                    case "alley":
                        weight *= 1.3
                    case "drive_through":
                        weight *= 5
                    case "slipway":
                        weight *= 7
                    case "layby":
                        weight *= 1.75
                    case _:
                        weight *= 2
            case _:
                return None
        return weight

    def additional_weight_road(self, way: dict) -> float:
        factor = 1
        if way.get("lanes"):
            try:
                lanes = int(way["lanes"])
                if lanes >= 2:
                    factor *= 2
            except ValueError:
                warn(f"Couldn't parse lanes={way['lanes']}")
        if truthy_tag(way, "shoulder"):
            factor *= 0.9
        if truthy_tag(way, "verge"):
            factor *= 0.95
        return factor

    def weight_path(self, way: dict) -> float | None:
        path_highway_values = [
            "footway",
            "bridleway",
            "steps",
            "corridor",
            "path",
            "cycleway",
            "track",
            "pedestrian",
        ]
        if way.get("highway") not in path_highway_values:
            return None
        weight = 1
        if way.get("highway") == "cycleway":
            mixed_use: bool = (
                way.get("segregated") in ["yes", "no"]
                or way.get("foot") == "designated"
            )
            if not mixed_use:
                # Mainly intended for cyclists
                weight *= 1.5

        # We will update this if we have decided to assume that a path is
        # inaccessible to wheelchairs (-1) or suitable for wheelchairs (1)
        wheelchair_suitable = 0
        if way.get("highway") == "steps":
            wheelchair_suitable = -1
            # TODO
            pass
        # We might guess the value of trail_visibility=*
        trail_visibility_default = None
        # Our guess for if a path is "officially" maintained or not
        maintained = 0
        if way.get("highway") in ["footway", "cycleway", "pedestrian"]:
            maintained = 1
            wheelchair_suitable = 1
        if way.get("designation"):
            maintained = 1
        if way.get("operator"):
            maintained = 1
        if way.get("informal") == "yes":
            maintained = -1
        if maintained == 1:
            trail_visibility_default = "excellent"
        if maintained == -1:
            weight *= 1.05
        # Parse sac_scale=*
        sac_scale = way.get("sac_scale")
        match sac_scale:
            case "strolling":
                weight *= 0.9
                wheelchair_suitable = 1
            case "hiking":
                weight *= 1
            case "mountain_hiking":
                weight *= 2.5
                wheelchair_suitable = -1
            case "demanding_mountain_hiking":
                wheelchair_suitable = -1
                if self.options.positive("treacherous_paths"):
                    # You maniac
                    weight *= 0.99
                elif self.options.negative("treacherous_paths"):
                    weight *= 10
                else:
                    weight *= 3
            case "alpine_hiking":
                wheelchair_suitable = -1
                if self.options.positive("treacherous_paths"):
                    weight *= 20
                elif self.options.negative("treacherous_paths"):
                    weight *= 1000
                else:
                    weight *= 30
            case "demanding_alpine_hiking" | "difficult_alpine_hiking":
                wheelchair_suitable = -1
                weight = inf
            case None:
                pass
            case _:
                warn(f"Ignoring unknown value sac_scale={sac_scale}")
        # Parse trail_visibility=*
        trail_visibility = way.get("trail_visibility", trail_visibility_default)
        match trail_visibility:
            case "excellent":
                weight *= 0.9
            case "good":
                weight *= 1.02
            case "intermediate" | "bad" | "horrible" | "no":
                weight *= 1.05
                # TODO: Warn the user that this section of the route has poor trail visibility
            case None:
                pass
            case _:
                warn(f"Ignoring unknown value trail_visibility={trail_visibility}")
        # Parse trailblazed=*
        trailblazed = way.get("trailblazed")
        if trailblazed is not None and trailblazed != "no":
            weight *= 0.91
        # Parse width=*
        width = way_width_meters(way)
        if width is not None:
            if width < 0.20:
                # 20cm gap is probably impassable!
                weight = inf
            elif width > 5:
                weight *= 0.9
            elif width > 2:
                weight *= 0.975
        # Parse designation=*
        designation = way.get("designation")
        match designation:
            case "public_footpath" | "public_bridleway" | "restricted_byway":
                weight *= 0.9
            case "byway_open_to_all_traffic":
                weight *= 0.95
            case "public_right_of_way":
                weight *= 0.91
            case "core_path":
                # Scotland!
                weight *= 0.9
        # Parse segregated=*
        segregated = way.get("segregated")
        match segregated:
            case "yes":
                weight *= 0.98
            case "no":
                weight *= 1.02
        # Handle obstacles along the path
        obstacle = way.get("obstacle")
        match obstacle:
            case "vegetation":
                weight *= 1.10
        # Handle any pavement preference
        if way.get("footway") == "sidewalk":
            weight *= 1 - self.options.get_tri_state("pavements") * 0.4
        # Add penalty for wheelchair users if the path is inaccessible
        print(self.options.true("wheelchair_accessible"))
        wheelchair = way.get("wheelchair", "yes" if wheelchair_suitable == 1 else "no")
        if self.options.true("wheelchair_accessible"):
            match wheelchair:
                case "yes":
                    weight *= 0.9
                case "no":
                    weight *= 100
                case "limited":
                    weight *= 0.96
                case "designated":
                    weight *= 0.89
        return weight

    def additional_weight_ford(self, way: dict) -> float:
        factor = 1
        match way.get("ford"):
            case "yes":
                factor *= 3
            case "stepping_stones":
                factor *= 2.5
        return factor

    def additional_weight_general(self, way: dict) -> float:
        factor = 1
        surface = way.get("surface")
        assumed_smoothness = None
        if surface in ["asphalt", "chipseal"]:
            assumed_smoothness = "good"
        nice_paved_surfaces = [
            "asphalt",
            "chipseal",
            "paving_stones:lanes",
            "paving_stones",
            "bricks",
            "concrete:plates",
            "concrete:lanes",
            "concrete",
        ]
        paved_surfaces = [
            "grass_paver",
            "sett",
            "unhewn_cobblestone",
            "metal",
            "metal_grid",
            "wood",
            "rubber",
            "tiles",
            "paved",
            "cobblestone",
            "cobblestone:flattened",
        ]
        nice_unpaved_surfaces = [
            "compacted",
            "fine_gravel",
            "gravel",
            "shells",
            "rock",
            "pebblestone",
            "woodchips",
        ]
        bare_ground_surfaces = ["dirt", "grass", "sand", "snow", "earth"]
        muddy_surfaces = ["mud"]
        if surface in nice_paved_surfaces:
            factor *= 1 - self.options.get_tri_state("paved_paths") * 0.5
            factor *= 0.95
        elif surface in paved_surfaces:
            factor *= 1 - self.options.get_tri_state("paved_paths") * 0.5
            factor *= 1.1 if self.options.true("wheelchair_accessible") else 0.95
        elif surface in nice_unpaved_surfaces:
            factor *= 1 - self.options.get_tri_state("unpaved_paths") * 0.5
            factor *= 0.99
        elif surface in bare_ground_surfaces:
            factor *= 1 - self.options.get_tri_state("unpaved_paths") * 0.5
            factor *= 1.05
        elif surface in muddy_surfaces:
            factor *= 1 - self.options.get_tri_state("unpaved_paths") * 0.5
            factor *= 4
        match way.get("smoothness", assumed_smoothness):
            case "excellent" | "good" | "intermediate":
                factor *= 0.95
            case "very_bad" | "horrible" | "very_horrible":
                factor *= 1.9
            case "impassable":
                is_okay = way.get("sac_scale") in ["strolling", "hiking"]
                factor *= 2 if is_okay else 5
        gradient = way_incline_gradient(way)
        if gradient is not None:
            if gradient != 0:
                factor *= 1.1
            if isinstance(gradient, int) and abs(gradient) > 0.025:
                # 2.5% as the maximum suitable incline for wheelchair users
                if self.options.true("wheelchair_accessible"):
                    factor *= 3
        factor *= self.additional_weight_ford(way)
        match way.get("lit"):
            case "yes" | "24/7" | "automatic" | "limited":
                lit = True
            case "no" | "disused":
                lit = False
            case _:
                lit = None
        if lit is True:
            factor *= 1 - self.options.get_tri_state("lit_paths") * 0.3
        indoors = (
            way.get("indoor") in ["yes", "corridor"] or way.get("highway") == "corridor"
        )
        if indoors:
            factor *= 1 - self.options.get_tri_state("indoor_paths") * 0.5
        covered = (
            truthy_tag(way, "covered")
            or truthy_tag(way, "tunnel")
            or truthy_tag(way, "shelter")
            or indoors
        )
        if covered:
            factor *= 1 - self.options.get_tri_state("covered_paths") * 0.4
        return factor

    def calculate_way_weight(self, way: dict) -> float:
        # Handle access tags
        if not self.access_is_legal(way):
            return inf

        # First, try parsing the way data as a road
        base_weight_as_road = self.base_weight_road(way)
        if base_weight_as_road is not None:
            has_sidewalk = way_has_sidewalk(way)
            sidewalk_guessed = False
            if has_sidewalk is None:
                # Sidewalk tags not present, so guess based off of road type
                has_sidewalk = way.get("highway") in [
                    "trunk",
                    "primary",
                    "secondary",
                    "tertiary",
                    "residential",
                    "unclassified",
                ]
                sidewalk_guessed = True
            if has_sidewalk == "no":
                # We're walking on the road carriageway
                if way.get("foot") == "use_sidepath":
                    # Never route along a carriageway if it's forbidden to do so
                    return inf
                additional_factors = self.additional_weight_road(way)
                return (
                    base_weight_as_road
                    * additional_factors
                    * self.additional_weight_general(way)
                )
            pavement_weight = (
                self.weight_path(
                    {
                        "highway": "footway",
                        "footway": "sidewalk",
                        "surface": "asphalt",
                    }
                )
                if not sidewalk_guessed
                # Deprioritize ways where we're just assuming a sidewalk is present
                else 1.2
            )
            if pavement_weight is None:
                warn("Failed to calculate pavement weight (this is a bug)")
                pavement_weight = 1
            # Improve or worsen the weight for walking along a pavement according to the road's maxspeed
            maxspeed_value = way_maxspeed_mph(way)
            if maxspeed_value and maxspeed_value >= 60:
                pavement_weight *= 1.1
            return pavement_weight

        # If it's not a road, try parsing as a path
        weight_as_path = self.weight_path(way)
        if weight_as_path is not None:
            return weight_as_path * self.additional_weight_general(way)
        if way.get("highway") == "road":
            warn("Encountered highway=road way")
            return 1

        # If it doesn't match any of the above, consider it unroutable
        return inf

    def calculate_crossing_weight(self, node: dict) -> float:
        # Crossing types
        crossing = node.get("crossing")
        crossing_ref = node.get("crossing_ref")
        weight = 2.5
        if crossing == "no":
            weight = inf
        if crossing == "zebra" or crossing_ref == "zebra":
            weight = 1.2
        if crossing == "traffic_signals":
            weight = 1
        if crossing == "uncontrolled" or crossing == "unmarked":
            weight = 2
        if crossing == "informal":
            weight = 4
        if crossing:
            warn(f"Ignoring unknown crossing tag: crossing={crossing}")
        # User's preference for crossing types
        marked_crossing = (
            crossing in ["zebra", "traffic_signals"]
            or crossing_ref == "zebra"
            or truthy_tag(node, "crossing:markings")
        )
        if self.options.true("prefer_marked_crossings"):
            if not marked_crossing:
                weight *= 3
        traffic_light_crossing = crossing == "traffic_signals" or truthy_tag(
            node, "traffic_signals"
        )
        if self.options.true("prefer_traffic_light_crossings"):
            if not traffic_light_crossing:
                weight *= 2.5

        # Additional crossing tags
        raised_crossing = node.get("traffic_calming") == "table"
        if raised_crossing:
            weight *= 0.75
        elif node.get("crossing:continuous") == "yes":
            weight *= 0.5
        if node.get("crossing:island") == "yes":
            weight *= 0.7
        if self.options.true("audible_crossings"):
            if node.get("traffic_signals:sound") == "yes":
                weight *= 0.6
            elif node.get("traffic_signals:sound") == "no":
                weight *= 4
        kerb = node.get("kerb")
        tactile_paving = node.get("tactile_paving")
        if self.options.true("wheelchair_accessible") or self.options.true(
            "prefer_dipped_kerbs"
        ):
            if kerb == "lowered" or raised_crossing:
                weight *= 0.8
            elif kerb == "flush":
                weight *= 0.75
        if self.options.true("prefer_tactile_paving"):
            if kerb == "flush" and tactile_paving == "no":
                weight *= 10
        # TODO parse tactile_paving
        return weight

    def calculate_node_weight(self, node_id: int) -> float:
        node = self.graph.node(node_id).get("tags")
        if not node:
            # Untagged node, so don't add any weight
            return 0
        if not self.access_is_legal(node):
            return inf
        # Most barriers only block motor traffic, so we only consider those that generally block pedestrians.
        # We assume (by default) that these barriers will be able to be opened by a pedestrian,
        # unless tagged with locked=yes
        if node.get("barrier") in ["gate", "sliding_gate", "wicket_gate"]:
            if node.get("locked") == "yes":
                return inf
        # We assume that these barriers will be impassable to pedestrians
        # unless explicitly tagged as open or unlocked
        if node.get("barrier") in ["barrier_board"]:
            explicitly_unlocked = node.get("locked") == "no" or node.get("open") in [
                "yes",
                "partial",
            ]
            if not explicitly_unlocked:
                return inf
        if node.get("highway") == "crossing":
            return self.calculate_crossing_weight(node)
        return 0

    def calculate_weight(self, node_a: int, node_b: int, way_data: OSMWayData) -> float:
        node_a_data = self.graph.node(node_a)
        node_b_data = self.graph.node(node_b)
        self.add_implicit_tags(way_data["tags"])
        way_weight = self.calculate_way_weight(way_data["tags"])
        node_weight = self.calculate_node_weight(node_a)
        # Making weight info available for debugging
        print(way_weight, way_data)
        if way_data["id"] in self.way_weights:
            # A bit of a hack: assumes that this function is called exactly once for each section (edge) of the way
            self.way_weights[way_data["id"]]["total_weight"] += (
                way_weight * way_data["length"]
            )
        else:
            self.way_weights[way_data["id"]] = {
                "weight": way_weight,
                "total_weight": way_weight * way_data["length"],
            }
        self.segment_weights[(node_a, node_b)] = {
            "pos_a": self.graph.node_position(node_a),
            "pos_b": self.graph.node_position(node_b),
            "weight": way_weight,
            "total_weight": way_weight * way_data["length"],
        }
        return node_weight + way_weight * way_data["length"]

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

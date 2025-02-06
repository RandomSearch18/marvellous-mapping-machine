from typing import Literal, TypedDict
import warnings


type Coordinates = tuple[float, float]


class BoundingBox:
    def __init__(self, min_lat, min_lon, max_lat, max_lon):
        self.min_lat = min_lat
        self.min_lon = min_lon
        self.max_lat = max_lat
        self.max_lon = max_lon
        # self.south = min_lat
        # self.west = min_lon
        # self.north = max_lat
        # self.east = max_lon

    def __str__(self):
        return f"{self.min_lat},{self.min_lon},{self.max_lat},{self.max_lon}"


class OSMElement:
    def __init__(self, type: str, tags: dict):
        self.type = type
        self.tags = tags


class OSMNode(OSMElement):
    def __init__(self, id: int, pos: Coordinates, tags: dict):
        super().__init__("node", tags)
        self.id = id
        self.pos = (pos[0], pos[1])


class OSMWay(OSMElement):
    def __init__(self, id: int, nodes: list[OSMNode], tags: dict):
        super().__init__("way", tags)
        self.id = id
        self.nodes = nodes


class OSMWayData(TypedDict):
    id: int
    tags: dict[str, str]
    length: float


def way_has_sidewalk(
    way: dict[str, str]
) -> Literal["both"] | Literal["left"] | Literal["right"] | Literal["no"] | None:
    """Returns whether the given way has a sidewalk on the left, right, both sides

    - Returns `None` if sidewalk information is not available
    - Warning: returns `"no"` if no sidewalk is present (not `False` as you might expect)
    """
    yes_values = ["yes"]
    no_values = ["no", "separate", "lane", "none"]

    sidewalk_left = way.get("sidewalk:left")
    if sidewalk_left:
        if sidewalk_left in yes_values:
            return "left"
        if sidewalk_left in no_values:
            return "no"
        warnings.warn(f"Unknown tag value: sidewalk:left={sidewalk_left}")
    sidewalk_right = way.get("sidewalk:right")
    if sidewalk_right:
        if sidewalk_right in yes_values:
            return "right"
        if sidewalk_right in no_values:
            return "no"
        warnings.warn(f"Unknown tag value: sidewalk:right={sidewalk_right}")
    sidewalk_both = way.get("sidewalk:both")
    if sidewalk_both:
        if sidewalk_both in yes_values:
            return "both"
        if sidewalk_both in no_values:
            return "no"
        warnings.warn(f"Unknown tag value: sidewalk:both={sidewalk_both}")

    match way.get("sidewalk"):
        case "both":
            return "both"
        case "left":
            return "left"
        case "right":
            return "right"
        case "no" | "none" | "separate" | "lane":
            return "no"
        case None:
            return None
        case unknown_value:
            warnings.warn(f"Unknown tag value: sidewalk={unknown_value}")
            return None


def parse_speed(value: str, unit: str) -> float:
    try:
        speed = float(value)
    except ValueError:
        raise ValueError(f"Invalid numeric value for speed: {value}")
    match unit:
        case "mph":
            return speed
        case "km/h" | "kmh" | "kmph":
            return speed / 1.609344
        case "knots":
            return speed * 1.15078
        case _:
            raise ValueError(f"Unknown unit for speed: {unit}")


def way_maxspeed_mph(way: dict[str, str]) -> float | None:
    value = way.get("maxspeed")
    if not value:
        return None
    normalised_value = value.strip().lower()
    match normalised_value.split(" "):
        case [speed, unit]:
            try:
                return parse_speed(speed, unit)
            except ValueError as e:
                warnings.warn(f"Invalid maxspeed: {e}")
                return None
        case [speed]:
            try:
                return parse_speed(speed, "km/h")
            except ValueError as e:
                warnings.warn(f"Invalid maxspeed: {e}")
                return None
        case _:
            warnings.warn(f"Invalid tag format: maxspeed={value}")
            return None


def way_width_meters(way: dict[str, str]) -> float | None:
    """Parses the width=* tag, falling back to est_width=* if not present"""
    value = way.get("width") or way.get("est_width")
    if not value:
        return None
    normalised_value = value.strip().lower()
    match normalised_value.split(" "):
        case [width, unit]:
            match unit:
                case "m" | "meters" | "metres" | "meter" | "metre":
                    try:
                        return float(width)
                    except ValueError as e:
                        warnings.warn(f"Invalid width: {e}")
                        return None
                case _:
                    # TODO: Implement other units
                    warnings.warn(f"Ignoring quantity with unit {unit}")
                    return None
        case [width]:
            try:
                return float(width)
            except ValueError as e:
                warnings.warn(f"Invalid width: {e}")
                return None
        case _:
            warnings.warn(f"Invalid tag format: width={value}")
            return None

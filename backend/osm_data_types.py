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


class OSMWay(OSMElement):
    def __init__(self, nodes: list[dict], tags: dict):
        super().__init__("way", tags)
        self.nodes = nodes


class OSMNode(OSMElement):
    def __init__(self, pos: Coordinates, tags: dict):
        super().__init__("node", tags)
        self.pos = (pos[0], pos[1])

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

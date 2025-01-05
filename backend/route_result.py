from osm_data_types import Coordinates
import abc


class RoutePart(abc.ABC):
    def __init__(self, distance: float, estimated_time: float):
        self.distance = distance
        self.estimated_time = estimated_time

    @abc.abstractmethod
    def description(self) -> str:
        raise NotImplementedError


class RouteProgression(RoutePart):
    def __init__(
        self,
        distance: float,
        estimated_time: float,
        start: Coordinates,
        end: Coordinates,
    ):
        super().__init__(distance, estimated_time)
        self.start = start
        self.end = end

    def description(self) -> str:
        return f"Walk {self.distance:.2f} meters ({self.estimated_time:.2f} s)"


class RouteManoeuvre(RoutePart):
    def __init__(self, estimated_time: float):
        super().__init__(distance=0, estimated_time=estimated_time)


class StartWalking(RouteManoeuvre):
    def __init__(self, position: Coordinates):
        super().__init__(estimated_time=0)
        self.position = position

    def description(self) -> str:
        return f"Start walking from {self.position}"


class Arrive(RouteManoeuvre):
    def __init__(self, position: Coordinates):
        super().__init__(estimated_time=0)
        self.position = position

    def description(self) -> str:
        return f"Arrive at {self.position}"


class RouteResult:
    def __init__(self, start: Coordinates, end: Coordinates, parts: list[RoutePart]):
        self.start = start
        self.end = end
        self.parts = parts

    def total_time(self) -> float:
        return sum(part.estimated_time for part in self.parts)

    def total_distance(self) -> float:
        return sum(
            part.distance for part in self.parts if isinstance(part, RouteProgression)
        )

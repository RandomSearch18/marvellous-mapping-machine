from sys import argv, stderr


def print_error(message):
    print(message, file=stderr)


def validate_args():
    if len(argv) == 2:
        return True
    if len(argv) < 2:
        print_error(
            f"Please provide a path to the OSM data file, e.g. {argv[0]} region.osm",
        )
        return False
    print_error(
        f"Too many arguments provided. Please provide a path to the OSM data file, e.g. {argv[0]} region.osm",
    )
    return False


def get_data_file_path():
    return argv[1]


if __name__ == "__main__":
    if not validate_args():
        exit(1)

    data_file_path = get_data_file_path()
    print(data_file_path)

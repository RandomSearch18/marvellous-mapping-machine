// Just a little MRE for some TS weirdness

type TriStateOption = -1 | 0 | 1

type Options = {
  unpaved_paths: TriStateOption
  paved_paths: TriStateOption
  allow_private: boolean
}

type BasicOptions = {
  [key in keyof Options]: TriStateOption | boolean
}

const options: Options = {
  unpaved_paths: 0,
  paved_paths: 0,
  allow_private: false,
}

const bo: BasicOptions = options

function setOption(key: keyof Options) {
  if (typeof options[key] === "number") {
    // bo[key] = -1
    options[key] = -1
  } else {
    console.error("Invalid option type")
  }
}

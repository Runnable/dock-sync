dock-sync
=========

sync all docker images with docker registries (pull if out-of-date, push if newer)

## Requirements

[node.js and npm](http://nodejs.org/download)

## Installation

`npm install -g dock-sync`

## Usage

```bash
Usage: dock-sync [options]

Options:
  -
  -h, --help              Output usage information
  -v, --version           Output the version number
  -d, --dryrun            Enable dryrun (simulate pushes and pulls). Flag.
  -h, --host <s>          Docker host. Default: $DOCKER_HOST or unix:///var/run/docker.sock
  -b, --bail              Exit process on first error. Flag.
  -i, --private           Only sync images with internal registries. Flag.
  -p, --public            Only sync images with the public registry. Flag.
  -c, --concurrency <n>   Push and pull concurrency. Default: 1
```

##Example

`dock-sync --host http://127.0.0.1:4243`

## License

MIT

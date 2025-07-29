# Site / portfolio

This is the source code for my personal site, portfolio and experiments: https://colinbellino.com

## Run the server:
- Download the latest version: https://github.com/colinbellino/site (as a zip file, or clone it)
- Open a terminal in the folder where you unpacked the project.
- On Windows: `build.exe`
- On MacOS:
  - `xattr -dr com.apple.quarantine ./`
  - `./build`
- Open `http://localhost:8000/worldmap.html?reload`

## Compile the site or server binaries
- compile in debug and start server: `jai first.jai` ([language](https://www.youtube.com/playlist?list=PLmV5I2fxaiCKfxMBrNsU1kgKJXD3PkyxO) still in private beta)
- compile in release mode and deploy: `jai first.jai - -release -no-server && netlify deploy --dir public`
- create server binary: `jai first.jai - -release -build` (not required, but useful for other people on the team who don't have access to the beta)

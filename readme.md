# Gift roundup

This was built for [Tanium](https://tanium.com/)'s internal holiday game jam 2025.

All code and content built 100% by real humans. No form of AI, generative or otherwise, was used in the development or production of this project.

## Play

To play, visit <https://parnic.github.io/tanium-game-jam-2025>

To play locally:

- Run `npm install`
- Run `npm run dev`
- Open the URL printed to the terminal in a web browser.

## Objective

Collect the presents scattered about the planet and get back to your ship while surviving the onslaught of the local fauna!

## How to play

Use WASD or arrow keys on the keyboard, click-/touch-and-drag for a virtual joystick, or the left joystick or DPAD on a connected gamepad to move your character.

Avoid enemies and choose your weapons and upgrades wisely.

Gather all the lost gifts and get back to your ship before being overwhelmed!

## Development

### Requirements

_Optional: I recommend using a tool like [mise](https://mise.jdx.dev/) to automatically manage your tool versions to match the project._

- Node.js (see [.nvmrc](./.nvmrc) for the current version)
- A web browser (tested with Chrome)

### Setup

Run `npm install` to install all dependencies.

Project was developed with VSCode, so there are some basic debug configs available if you use that IDE.

### Running and iterating

Use `npm run dev` to start a local server (`npm run dev -- --host` if you want it accessible from other machines on the network) and open the URL it displays after starting up.

Launch the debugging configuration from VSCode to open Chrome to the appropriate URL if you want to be able to debug in VSCode (set breakpoints, etc.), or open the URL given from the last step to use any browser without debugging.

### Linting and formatting

Pre-commit hooks will be installed after `npm install` which will run when you attempt to commit files with git. `npm run lint` and `npm run build` can be used to see what will be checked, and `npm run format` will automatically enforce many syntactical and formatting requirements. Use "format on save" in your IDE to have this handled for you automatically.

### Deployment

GitHub actions are configured to build and deploy the project to its supported host locations. To build yourself, use `npm run build` and use the files in the `dist` directory. `npm run serve` can be used to start a webserver for the `dist` files to see the game as it will look for players.

## Credits

- Programming, stage design: [Parnic](https://github.com/parnic)
- Engine: [Excalibur.js](https://excaliburjs.com)
- Art: [Kenney.nl](https://kenney.nl) and Parnic's lovely wife
- SFX: [Kenney.nl](https://kenney.nl), Zapsplat.com
- Music from #Uppbeat (free for Creators!): <https://uppbeat.io/t/adam-tell/dyadic>, <https://uppbeat.io/t/sky-toes/labyrinth>, <https://uppbeat.io/t/2050-music/countach>

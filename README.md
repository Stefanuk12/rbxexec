# rbxexec
Execute and control your Roblox exploit from the command line. This mainly supports Synapse but it is possible to add support for other exploits. The only issue is how attaching is going to work.

## Usage
```
Usage: rbxexec [options] [command]

Execute and control your Roblox exploit from the command line

Options:
  -V, --version             output the version number
  -h, --help                display help for command

Commands:
  enable <path>             Enable Synapse's built in WebSocket
  attach                    Attach Synapse to Roblox
  execute [options] <data>  Executes a script
  hub-execute [options]     Executes a script from the script hub
  help [command]            display help for command
```
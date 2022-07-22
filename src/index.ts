#!/usr/bin/env node

// Dependencies
import * as fs from "fs"
import { program } from "commander"
import { SocketCommunicate } from "./modules/SocketCommunicate.js";
import got from "got";

//
function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

// Vars
const PackageData = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf-8"))
const Communicater = new SocketCommunicate({
    BaseURL: "ws://localhost:24892/",
    Timeout: 30 * 1000
})

// Program Data
program
    .name(PackageData.name)
    .description(PackageData.description)
    .version(PackageData.version);

// Enables websockets
{
    const Command = program.command("enable").description("Enable Synapse's built in WebSocket")

    // Arguments
    Command.argument("<path>", "path to synapse directory")

    // Main functionality
    Command.action(async (Path) => {
        // Get the theme path, making sure it exists
        const ThemePath = `${Path}/bin/theme-wpf.json`
        if (!fs.existsSync(ThemePath))
            throw(new Error("Invalid Synapse Path"))  

        // Get the data and enable websocket
        const Theme = JSON.parse(fs.readFileSync(ThemePath, "utf-8"))
        Theme.Main.WebSocket.Enabled = true

        // Output
        fs.writeFileSync(ThemePath, JSON.stringify(Theme, null, "\t"))
        console.log("Done!")
    })
}

// Attaches Synapse
{
    const Command = program.command("attach").description("Attach Synapse to Roblox")
 
    // Main functionality
    Command.action(async () => {
        //
        const Response = await Communicater.Attach(true)
        console.log(1)
        // Output
        console.log(`Attach ran. Response: ${Response}`)
    }) 
}

// Runs a script
interface IExecuteOptions {
    file: boolean
}
{
    const Command = program.command("execute").description("Executes a script")

    // Arguments
    Command.argument("<data>", "The data/file to execute")

    // Options
    Command.option("-f, --file", "Treats the supplied data as a file", false)

    // Main functionality
    Command.action(async (Data, Options: IExecuteOptions) => {
        // Vars
        let ToExecute = Data

        // File Resolve
        if (Options.file) {
            // Make sure it exists
            if (!fs.existsSync(Data))
                throw(new Error("File path is not valid"))

            // Set
            Data = fs.readFileSync(Data, "utf-8")
        }

        // Execute
        await Communicater.ExecuteScript(ToExecute)
        console.log("Executed.")
    })
}

// Runs one of the script hub scripts
interface IExecuteHubOptions {
    darkDex: boolean
    remoteSpy: boolean
    scriptDumper: boolean
}
{
    const Command = program.command("hub-execute").description("Executes a script from the script hub")

    // Options
    Command.option("-dd, --dark-dex", "Dark Dex", false)
    Command.option("-rs, --remote-spy", "Highly not recommended to use this.", false)
    Command.option("-sd, --script-dumper", "Script Dumper", false)

    // Main functionality
    Command.action(async (Options: IExecuteHubOptions) => {
        // Dark Dex
        if (Options.darkDex) {
            const Script = await got("https://cdn.synapse.to/synapsedistro/hub/DarkDex.lua").text()
            await Communicater.ExecuteScript(Script)
            console.log("Ran Dark Dex.")
        }

        // Remote Spy
        if (Options.remoteSpy) {
            const Script = await got("https://cdn.synapse.to/synapsedistro/hub/RemoteSpy.lua").text()
            await Communicater.ExecuteScript(Script)
            console.log("Ran Remote Spy.")
        }

        // Script Dumper
        if (Options.scriptDumper) {
            const Script = await got("https://cdn.synapse.to/synapsedistro/hub/ScriptDumper.lua").text()
            await Communicater.ExecuteScript(Script)
            console.log("Ran Script Dumper.")
        }
    })
}

// Parse it all
program.parse(process.argv)
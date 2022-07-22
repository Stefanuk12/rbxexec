// Dependencies
import { WebSocket } from "ws"
import WebSocketAsPromised from "websocket-as-promised"

//
export interface ISocketCommunicate {
    BaseURL: string
    Timeout: number
}
export interface SocketCommunicate extends ISocketCommunicate {}

export type TAttachResponse = "READY" | "ALREADY_ATTACHED" | "REATTACH_READY" | "NOT_LATEST_VERSION" | "FAILED_TO_FIND" | "INTERRUPT"

//
export class SocketCommunicate {
    // Vars
    ExecuteListener: WebSocketAsPromised
    AttachListener: WebSocketAsPromised

    // Constructor
    constructor(Data: ISocketCommunicate) {
        // Set
        Object.assign(this, Data)

        // Make the clients
        const DataOptions = {
            createWebSocket: (url: string) => new WebSocket(url),
            extractMessageData: (event: any) => event,
        }
        this.AttachListener = new WebSocketAsPromised(this.BaseURL + "attach", <any>DataOptions)
        this.ExecuteListener = new WebSocketAsPromised(this.BaseURL + "execute", <any>DataOptions)
    }

    //
    GetSocketResponse(websocket: WebSocketAsPromised) {
        return new Promise((resolve, reject) => {
            // Timer to check for time out
            let timer = setTimeout(() => {
                reject(new Error("WebSocket Timeout"))
            }, this.Timeout)

            // Listen
            websocket.onMessage.addOnceListener(data => {
                clearTimeout(timer)
                resolve(data)
            })
        })     
    }

    //
    async CheckReady() {
        // Open
        if (!this.AttachListener.isOpened)
            await this.AttachListener.open()

        // Send and wait for response
        this.AttachListener.send("IS_READY")
        let Response = <Buffer>(await this.GetSocketResponse(this.AttachListener))
        await this.AttachListener.close()

        // Return
        return Response.toString() == "TRUE"
    }

    // Attach
    async Attach(ErrorOnFail: boolean = false) {
        // Make sure is not attached
        if (!await this.CheckReady())
            throw(new Error("Not ready"))
        
        // Attempt to attach and get response
        await this.AttachListener.open()
        this.AttachListener.send("ATTACH")
        const Status = <TAttachResponse>(await this.GetSocketResponse(this.AttachListener))
        await this.AttachListener.close()

        // Error if not attached
        if (ErrorOnFail && Status == "NOT_LATEST_VERSION" || Status == "FAILED_TO_FIND" || Status == "INTERRUPT")
            throw(new Error("Failed to attach"))

        // Return
        return Status
    }

    // Execute
    async ExecuteScript(Content: string) {
        // Attach first
        await this.Attach(true)

        // Execute
        await this.ExecuteListener.open()
        this.ExecuteListener.send(Content)
        const Response = await this.GetSocketResponse(this.ExecuteListener)
        await this.ExecuteListener.close()

        // Check
        if (Response != "OK")
            throw(new Error("Error occured while executing"))
    }
}
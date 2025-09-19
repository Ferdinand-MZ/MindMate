import {inngest} from "./index"

const helloWorld = inngest.createFunction(
    {id: "hello-world"},
    {event: "test/hello.world"},
    async ({event, step}) => {
        await step.sleep("tunggu sebentar", "1s")
    return {message: `Hello ${event.data.email}!`}
    }
)

export const functions = [helloWorld];
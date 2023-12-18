import { event, invoke } from "@tauri-apps/api";
import { createSignal, For, onMount } from "solid-js";
import { container, row } from "./index.css";

const service = {
    invoke
}

export default function App() {
    const [commandText, setCommandText] = createSignal("");
    const [videos, setVideos] = createSignal<unknown[]>([])

    onMount(() => {
        event.listen('got_video', (event) => {
            console.log(event.payload)
            setVideos(vids => vids.concat(event.payload))
        })
    })

    function handleSubmit(e: Event) {
        e.preventDefault();
        service.invoke('search_youtube', { searchTerm: commandText(), videosAmount: 3 })
    }

    return (
        <main class={container}>
            <form class={row} onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Command"
                    list="commands"
                    value={commandText()}
                    onInput={(e) => setCommandText(e.currentTarget.value)}
                />
                <datalist id="commands">
                    <option value="Search" />
                    <option value="Refresh" />
                </datalist>
                <button style="width:unset;" type="submit">{">"}</button>
            </form>
            <div>
                <For each={videos()}>
                    {(video) => (
                        <iframe width="1280" height="720" src={"https://www.youtube.com/embed/" + (video as any).id} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" />
                    )}
                </For>
            </div>
        </main>
    );
}

// function preventDefault<E extends Event>(e: E) {
//     e.preventDefault()
//     return e
// }

// function fork<Args extends any[], Fn extends (...args: Args) => void>(...funcs: Fn[]) {
//     return (...args: Args) => funcs.forEach(func => func(...args))
// }

import { Fragment, useEffect, useReducer, useRef, useState } from "react";

export function App() {
  const [time, setTime] = useState(0)


  return (
    <main>
      <h1>Hello from App</h1>
      <Video />

      <main>
        <div />
        <TimeConsumer time={time} />
        <LargeTable title="Title" />
        <div />
      </main>
    </main>
  );

}

function LargeTable({}: {title: string}) {
  return <Fragment></Fragment>
}

function Video() {
  const [timeSeconds, setTime] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    requestAnimationFrame(() => {
      setTime(videoRef.current!.currentTime)
    })
  })

  return <video ref={videoRef} />;
}

function TimeConsumer({ time }: { time: number }) {
  return <Fragment></Fragment>
}
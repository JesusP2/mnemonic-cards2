import { useEffect } from "react"
import { client } from '@repo/api/client'

export default function Home() {
  useEffect(() => {
    client
  }, [])
  return <div>hello</div>
}

import { useState } from "react"
import type { Outing } from "../data/outings"

/** Show an outing photo with source credits, omitting unavailable images. */
export function OutingPhoto({ photo, onLoad }: Props) {
  const [failedUrl, setFailedUrl] = useState<string>()
  if (!photo || failedUrl === photo.url) return null
  return (
    <figure className="outing-photo">
      <img
        src={photo.url}
        alt={photo.alt}
        loading="lazy"
        decoding="async"
        onLoad={onLoad}
        onError={() => setFailedUrl(photo.url)}
      />
      <figcaption>
        Photo:{" "}
        <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
          {photo.credit}
        </a>{" "}
        ·{" "}
        <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
          {photo.license}
        </a>
      </figcaption>
    </figure>
  )
}

type Props = {
  /** Optional image and its attribution. */
  photo?: Outing["photo"]
  /** Reposition a map popover after its image changes the content height. */
  onLoad?: () => void
}

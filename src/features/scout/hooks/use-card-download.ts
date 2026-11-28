import { useRef, useState } from "react"

import { toCanvas } from "html-to-image"

const PIXEL_RATIO = 2
/** SVG parçalarının rengini veren özellikler; görselde çözülmüş değerleriyle yazılır. */
const SVG_PAINT = ["fill", "stroke"] as const

/**
 * Görsel alınırken kartı ekrandaki son haliyle sabitler ve geri almak için bir fonksiyon döner.
 * - Süslerin süzülme animasyonu durdurulur; yoksa kopyada animasyon baştan başlar ve süsler ilk karede,
 *   yani görünmez yakalanır.
 * - SVG parçalarının `fill`/`stroke` değerleri `var(--card-accent)` gibi CSS değişkenleri. Görsel
 *   kütüphanesi SVG'nin iç parçalarına değişkenleri taşımadığı için renk çözülemez ve siyaha düşer;
 *   bu yüzden her parçaya hesaplanmış rengi satır içi yazılır.
 */
function freezeForCapture(node: HTMLElement): () => void {
  node.setAttribute("data-capturing", "")
  const restores = Array.from(node.querySelectorAll<SVGElement>("svg *")).flatMap((element) => {
    const computed = getComputedStyle(element)
    return SVG_PAINT.map((property) => {
      const previous = element.style.getPropertyValue(property)
      element.style.setProperty(property, computed.getPropertyValue(property))
      return () => {
        if (previous) element.style.setProperty(property, previous)
        else element.style.removeProperty(property)
      }
    })
  })
  return () => {
    node.removeAttribute("data-capturing")
    for (const restore of restores) restore()
  }
}

/** The card already prints its address in the nameplate band, so the capture is the card as shown. */
async function renderShareCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  const restore = freezeForCapture(node)
  return toCanvas(node, { pixelRatio: PIXEL_RATIO, cacheBust: true }).finally(restore)
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Görsel oluşturulamadı"))))
  })
}

function saveFile(href: string, fileName: string) {
  const link = document.createElement("a")
  link.href = href
  link.download = `${fileName}.png`
  link.click()
}

/** Kartı paylaşılabilir bir PNG olarak indirir ya da panoya kopyalar. */
export function useCardDownload(fileName: string) {
  const cardRef = useRef<HTMLElement>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  const download = async () => {
    const node = cardRef.current
    if (!node) return
    setIsDownloading(true)
    try {
      const canvas = await renderShareCanvas(node)
      saveFile(canvas.toDataURL("image/png"), fileName)
    } catch (error) {
      throw new Error("Kart görseli oluşturulamadı", { cause: error })
    } finally {
      setIsDownloading(false)
    }
  }

  /** Pano izni yoksa görsel kaybolmasın diye dosya olarak indirilir. */
  const copy = async (): Promise<"copied" | "downloaded" | "skipped"> => {
    const node = cardRef.current
    if (!node) return "skipped"
    setIsCopying(true)
    try {
      // Safari panoya yazmayı kullanıcı etkileşimi sırasında başlatmayı ister; Promise doğrudan verilir.
      const blob = renderShareCanvas(node).then(canvasToBlob)
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        return "copied"
      } catch {
        const url = URL.createObjectURL(await blob)
        saveFile(url, fileName)
        URL.revokeObjectURL(url)
        return "downloaded"
      }
    } catch (error) {
      throw new Error("Kart görseli kopyalanamadı", { cause: error })
    } finally {
      setIsCopying(false)
    }
  }

  return { cardRef, download, isDownloading, copy, isCopying }
}

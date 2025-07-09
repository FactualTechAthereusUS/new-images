import { getProxyImageUrl } from '../utils/imageProxy'

interface ProductCardProps {
  id: string
  title: string
  images: Array<{ src: string }>
  onClick: () => void
}

export default function ProductCard({ id, title, images, onClick }: ProductCardProps) {
  return (
    <div
      className="border rounded-lg p-2 hover:shadow-xl cursor-pointer"
      onClick={onClick}
    >
      <img
        src={getProxyImageUrl(images?.[0]?.src || '')}
        alt={title}
        className="w-full h-auto rounded"
      />
      <p className="text-sm mt-2">{title}</p>
    </div>
  )
}

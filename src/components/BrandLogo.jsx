
export default function BrandLogo({ className = '', alt = 'Sonata Software' }) {
  return (
    <img
      className={`sonata-logo ${className}`.trim()}
      src="/sonata-logo.png"
      alt={alt}
      draggable="false"
    />
  )
}
